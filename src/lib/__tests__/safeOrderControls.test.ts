import {
  decodeFunctionData,
  erc20Abi,
  maxUint256,
  type PublicClient,
} from "viem";

import {
  COMPOSABLE_COW_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
} from "#/lib/contracts";
import {
  buildSafeApprovalRepair,
  createSafeOrderControls,
} from "#/lib/safeOrderControls";
import { type PreparedCancellation } from "#/lib/stopLossCancellation";
import { type StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

const account = "0x1111111111111111111111111111111111111111";
const hash = `0x${"ab".repeat(32)}` as const;
const proposal = `0x${"cd".repeat(32)}` as const;
const order: StopLossOrder = {
  id: "safe:order",
  parentId: "safe:order",
  chainId: 1,
  owner: account,
  hash,
  validTo: 4102444800,
  status: OrderStatus.OPEN,
  isSellOrder: true,
  receiver: account,
  sellAmount: BigInt(100),
  buyAmount: BigInt(200),
  strike: BigInt(2),
  partiallyFillable: true,
  sellToken: { address: account, decimals: 18, symbol: "WETH" },
  buyToken: { address: account, decimals: 6, symbol: "USDC" },
  sellTokenPriceOracle: account,
  buyTokenPriceOracle: account,
  maxTimeSinceLastOracleUpdate: 3600,
  executedSellAmount: null,
  executedBuyAmount: null,
  executedFee: null,
};
const prepared: PreparedCancellation = {
  execution: "safe",
  account,
  order,
  hash,
  blockNumber: BigInt(100),
  transaction: {
    account,
    chainId: 1,
    to: COMPOSABLE_COW_ADDRESS,
    data: "0x",
    value: BigInt(0),
  },
};
function options() {
  const values = new Map<string, string>();
  return {
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    },
    locks: {
      request: async <T>(_key: string, task: () => Promise<T>) => task(),
    },
    now: () => 1700000000000,
  };
}

test("Safe approval repair approves the vault relayer directly from the verified owner", async () => {
  let allowance = BigInt(0);
  const client = {
    getBytecode: async () =>
      "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea264697066735822122003d1488ee65e08fa41e58e888a9865554c535f2c77126a82cb4c0f917f31441364736f6c63430007060033",
    getStorageAt: async () =>
      `0x${"00".repeat(12)}41675c099f32341bf84bfc5382af534df5c7461a`,
    readContract: async ({
      functionName,
      args,
    }: {
      functionName: string;
      args: unknown[];
    }) => {
      if (functionName === "singleOrders") return true;
      if (
        functionName === "allowance" &&
        args[0] === account &&
        args[1] === GPV2_VAULT_RELAYER_ADDRESS
      )
        return allowance;
      throw new Error("Unexpected Safe approval RPC");
    },
  } as unknown as PublicClient;
  const repair = await buildSafeApprovalRepair({ account, order }, { client });
  expect(repair?.transaction).toMatchObject({
    account,
    to: order.sellToken.address,
  });
  expect(
    decodeFunctionData({ abi: erc20Abi, data: repair!.transaction.data }),
  ).toEqual({
    functionName: "approve",
    args: [GPV2_VAULT_RELAYER_ADDRESS, maxUint256],
  });
  allowance = order.sellAmount;
  expect(
    await buildSafeApprovalRepair({ account, order }, { client }),
  ).toBeUndefined();
  allowance = order.sellAmount - BigInt(1);
  const reset = await buildSafeApprovalRepair({ account, order }, { client });
  expect(reset?.target).toBe(BigInt(0));
  allowance = maxUint256;
  expect(
    await buildSafeApprovalRepair({ account, order }, { client }),
  ).toBeUndefined();
});

test("accepted Safe cancellation survives reload without using its proposal as a mined hash", async () => {
  const store = options();
  const controls = createSafeOrderControls(store);
  await controls.submitCancellation(prepared, async () => ({
    id: proposal,
    kind: "proposal",
  }));
  const reloaded = createSafeOrderControls(store);
  expect(reloaded.getRecords({ account, chainId: 1 })).toEqual([
    expect.objectContaining({
      action: "cancel",
      status: "pending",
      reference: { id: proposal, kind: "proposal" },
    }),
  ]);
  expect(reloaded.getRecords({ account, chainId: 100 })).toEqual([]);
});

test("accepted Safe approval is retained and confirms only after execution and allowance", async () => {
  const store = options();
  const controls = createSafeOrderControls(store);
  await controls.submitApproval(
    {
      account,
      order,
      target: maxUint256,
      transaction: {
        account,
        chainId: 1,
        to: order.sellToken.address,
        value: BigInt(0),
        data: "0x",
      },
    },
    async () => ({ id: proposal, kind: "proposal" }),
  );
  const reloaded = createSafeOrderControls(store);
  expect(reloaded.getRecords({ account, chainId: 1 })[0]).toMatchObject({
    action: "approve",
    status: "pending",
  });
  const previousFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      safe: account,
      safeTxHash: proposal,
      nonce: "1",
      isExecuted: true,
      isSuccessful: true,
      transactionHash: hash,
    }),
  })) as unknown as typeof fetch;
  let allowance = BigInt(0);
  const client = {
    readContract: async () => allowance,
  } as unknown as PublicClient;
  try {
    await reloaded.refresh({ account, chainId: 1 }, { client });
    expect(reloaded.getRecords({ account, chainId: 1 })[0].status).toBe(
      "pending",
    );
    allowance = maxUint256;
    await reloaded.refresh({ account, chainId: 1 }, { client });
    expect(reloaded.getRecords({ account, chainId: 1 })[0].status).toBe(
      "confirmed",
    );
  } finally {
    global.fetch = previousFetch;
  }
});

test("an accepted cancellation cannot be submitted again after order expiry", async () => {
  const store = options();
  const controls = createSafeOrderControls(store);
  await controls.submitCancellation(prepared, async () => ({
    id: proposal,
    kind: "proposal",
  }));
  const reloaded = createSafeOrderControls({
    ...store,
    now: () => 4202444800000,
  });
  const send = jest.fn(async () => ({ id: hash, kind: "proposal" as const }));
  await expect(reloaded.submitCancellation(prepared, send)).rejects.toThrow(
    "already awaiting signatures",
  );
  expect(send).not.toHaveBeenCalled();
  expect(reloaded.getRecords({ account, chainId: 1 })).toHaveLength(1);
});

test("cancellation needs successful Safe execution and an inactive single order", async () => {
  const controls = createSafeOrderControls(options());
  await controls.submitCancellation(prepared, async () => ({
    id: proposal,
    kind: "proposal",
  }));
  let executed = false;
  const previousFetch = global.fetch;
  global.fetch = jest.fn(async (url: string | URL | Request) => ({
    ok: true,
    json: async () =>
      String(url).includes("action=replacements")
        ? { results: [] }
        : {
            safe: account,
            safeTxHash: proposal,
            nonce: "1",
            isExecuted: executed,
            isSuccessful: executed ? true : null,
            transactionHash: executed ? hash : null,
          },
  })) as unknown as typeof fetch;
  let active = false;
  const client = {
    readContract: async () => active,
  } as unknown as PublicClient;
  try {
    await controls.refresh({ account, chainId: 1 }, { client });
    expect(controls.getRecords({ account, chainId: 1 })[0].status).toBe(
      "pending",
    );
    executed = true;
    active = true;
    await controls.refresh({ account, chainId: 1 }, { client });
    expect(controls.getRecords({ account, chainId: 1 })[0].status).toBe(
      "pending",
    );
    active = false;
    await controls.refresh({ account, chainId: 1 }, { client });
    expect(controls.getRecords({ account, chainId: 1 })[0].status).toBe(
      "confirmed",
    );
  } finally {
    global.fetch = previousFetch;
  }
});
