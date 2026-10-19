import { decodeFunctionData, type PublicClient } from "viem";

import { composableCowAbi } from "#/lib/abis/composableCow";
import { cowShedFactoryAbi } from "#/lib/abis/cowShedFactory";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import {
  buildCancellation,
  observeCancellation,
} from "#/lib/stopLossCancellation";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

const account = "0x1111111111111111111111111111111111111111";
const factory = "0x3333333333333333333333333333333333333333";
const owner = "0x4444444444444444444444444444444444444444";
const hash = `0x${"ab".repeat(32)}` as const;
const order: StopLossOrder = {
  id: "1:creation",
  parentId: "creation",
  chainId: 1,
  owner,
  hash,
  status: OrderStatus.OPEN,
  receiver: account,
  sellAmount: BigInt("1000000000000000000"),
  buyAmount: BigInt("2000000000"),
  validTo: 4102444800,
  sellToken: { address: account, decimals: 18, symbol: "WETH" },
  buyToken: { address: owner, decimals: 6, symbol: "USDC" },
  strike: BigInt(2000),
  partiallyFillable: true,
  isSellOrder: true,
  sellTokenPriceOracle: account,
  buyTokenPriceOracle: owner,
  maxTimeSinceLastOracleUpdate: 3600,
  executedSellAmount: null,
  executedBuyAmount: null,
  executedFee: null,
};
test("a Safe proposal stays pending until a later mined block removes the order", async () => {
  const client = rpc();
  const prepared = await buildCancellation({
    account,
    order,
    client: client as unknown as PublicClient,
  });
  const proposal = `0x${"cd".repeat(32)}` as const;
  const getTransactionReceipt = jest.fn(async () => {
    throw Object.assign(new Error("not found"), {
      name: "TransactionReceiptNotFoundError",
    });
  });
  const observation = {
    ...client,
    getTransactionReceipt,
  } as unknown as PublicClient;
  expect(
    await observeCancellation(prepared, proposal, { client: observation }),
  ).toBe(false);
  client.getBlockNumber.mockResolvedValue(BigInt(101));
  client.readContract.mockResolvedValue(false as never);
  expect(
    await observeCancellation(prepared, proposal, { client: observation }),
  ).toBe(true);
});

test("a verified Safe removes its direct-owned order without CowShed", async () => {
  const client = {
    getBlockNumber: async () => BigInt(100),
    getBytecode: async () =>
      "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea264697066735822122003d1488ee65e08fa41e58e888a9865554c535f2c77126a82cb4c0f917f31441364736f6c63430007060033",
    getStorageAt: async () =>
      `0x${"00".repeat(12)}41675c099f32341bf84bfc5382af534df5c7461a`,
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName === "singleOrders") return true;
      throw new Error("Safe cancellation must not read CowShed");
    },
  } as unknown as PublicClient;
  const prepared = await buildCancellation({
    account,
    order: { ...order, owner: account },
    client,
  });
  expect(prepared.transaction.to).toBe(COMPOSABLE_COW_ADDRESS);
  expect(
    decodeFunctionData({
      abi: composableCowAbi,
      data: prepared.transaction.data,
    }),
  ).toEqual({ functionName: "remove", args: [hash] });
});

test("direct Safe observation never treats a pending proposal as a mined cancellation", async () => {
  const prepared = {
    execution: "safe" as const,
    account,
    order: { ...order, owner: account },
    hash,
    blockNumber: BigInt(100),
    transaction: {
      account,
      chainId: 1 as const,
      to: COMPOSABLE_COW_ADDRESS,
      value: BigInt(0),
      data: "0x" as const,
    },
  } as const;
  const previousFetch = global.fetch;
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () =>
      String(url).includes("action=replacements")
        ? { results: [] }
        : {
            safe: account,
            safeTxHash: hash,
            nonce: "1",
            isExecuted: false,
            isSuccessful: null,
            transactionHash: null,
          },
  })) as unknown as typeof fetch;
  try {
    const client = {
      getBlockNumber: async () => BigInt(101),
      readContract: async () => false,
      getTransactionReceipt: async () => {
        throw new Error("Proposal IDs are not mined hashes");
      },
    } as unknown as PublicClient;
    expect(await observeCancellation(prepared, hash, { client })).toBe(false);
  } finally {
    global.fetch = previousFetch;
  }
});

function rpc() {
  const readContract = jest.fn(
    async ({ functionName }: { functionName: string }) => {
      if (functionName === "COW_SHED_FACTORY") return factory;
      if (functionName === "proxyOf") return owner;
      if (functionName === "trustedExecutor") return factory;
      if (functionName === "singleOrders") return true;
      throw new Error(`Unexpected RPC read: ${functionName}`);
    },
  );
  const getBlockNumber = jest.fn(async () => BigInt(100));
  return { readContract, getBlockNumber };
}

test("builds only the selected order removal through the pinned CowShed factory", async () => {
  const client = rpc();
  const prepared = await buildCancellation({
    account,
    order,
    client: client as unknown as PublicClient,
  });
  expect(prepared.transaction).toMatchObject({
    account,
    chainId: 1,
    to: factory,
    value: BigInt(0),
  });
  const decoded = decodeFunctionData({
    abi: cowShedFactoryAbi,
    data: prepared.transaction.data,
  });
  expect(decoded.functionName).toBe("executeOwnHooks");
  if (decoded.functionName !== "executeOwnHooks")
    throw new Error("Wrong dispatch");
  expect(decoded.args[0]).toEqual([
    {
      target: COMPOSABLE_COW_ADDRESS,
      value: BigInt(0),
      allowFailure: false,
      isDelegateCall: false,
      callData: expect.any(String),
    },
  ]);
  expect(
    decodeFunctionData({
      abi: composableCowAbi,
      data: decoded.args[0][0].callData,
    }),
  ).toEqual({ functionName: "remove", args: [hash] });
  expect(
    client.readContract.mock.calls.every(([call]) => "blockNumber" in call),
  ).toBe(true);
});
