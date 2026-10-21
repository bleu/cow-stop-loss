/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import {
  getStopLossApprovalRepair,
  resumeStopLossApprovalRepair,
} from "#/hooks/useStopLossApprovalRepair";
import { GPV2_VAULT_RELAYER_ADDRESS } from "#/lib/contracts";
import type {
  ApprovalRepairWork,
  PreparedApprovalRepair,
} from "#/lib/pollerStopLoss";
import { publicClientsFromIds } from "#/lib/publicClients";

const account = "0x1111111111111111111111111111111111111111";
const scope = { account, chainId: 1 } as const;
const transactionHash = `0x${"cd".repeat(32)}` as const;
const prepared: PreparedApprovalRepair = {
  ...scope,
  kind: "repair",
  owner: "0x4444444444444444444444444444444444444444",
  factory: "0x3333333333333333333333333333333333333333",
  poller: "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
  scheduleId: `0x${"aa".repeat(32)}`,
  paramsHash: `0x${"bb".repeat(32)}`,
  orderDigest: `0x${"cc".repeat(32)}`,
  domainSeparator: `0x${"dd".repeat(32)}`,
  staticInput: "0x",
  draft: {
    isSellOrder: true,
    tokenSell: {
      address: "0x6666666666666666666666666666666666666666",
      decimals: 18,
      symbol: "WETH",
    },
    salt: `0x${"ab".repeat(32)}`,
    validTo: 1800003600,
    tokenSellOracle: "0x8888888888888888888888888888888888888888",
    tokenBuyOracle: "0x9999999999999999999999999999999999999999",
    maxHoursSinceOracleUpdates: 1,
  },
};
const work: ApprovalRepairWork = {
  stage: "wallet",
  target: BigInt(3),
  transaction: {
    account,
    chainId: 1,
    to: prepared.draft.tokenSell.address,
    data: "0x",
    value: BigInt(0),
  },
};
const client = publicClientsFromIds[1];

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: async (_name: string, action: () => unknown) => action(),
    },
  });
  jest.spyOn(client, "getTransaction").mockResolvedValue({
    from: account,
    to: prepared.draft.tokenSell.address,
    input: "0x",
    value: BigInt(0),
    nonce: 7,
    blockNumber: null,
  } as never);
  jest.spyOn(client, "getBlockNumber").mockResolvedValue(BigInt(100));
  jest
    .spyOn(client, "getBlock")
    .mockResolvedValue({ transactions: [] } as never);
  jest.spyOn(client, "waitForTransactionReceipt").mockResolvedValue({
    status: "success",
    transactionHash,
    blockNumber: BigInt(101),
  } as never);
});
afterEach(() => jest.restoreAllMocks());

async function submitRepair() {
  return getStopLossApprovalRepair().submit(prepared, work, async () => ({
    id: transactionHash,
    transactionHash,
  }));
}

test("keeps a successful receipt pending when the allowance read throws and retries only reads", async () => {
  const read = jest
    .spyOn(client, "readContract")
    .mockRejectedValueOnce(new Error("Allowance RPC unavailable"))
    .mockResolvedValue(BigInt(3));
  await submitRepair();

  const [pending] = await resumeStopLossApprovalRepair(account, 1);
  expect(pending).toMatchObject({
    status: "pending",
    reference: { transactionHash, blockNumber: BigInt(101) },
    error: "Allowance RPC unavailable",
  });
  await expect(submitRepair()).rejects.toThrow(/already active|pending/);

  const [confirmed] = await resumeStopLossApprovalRepair(account, 1);
  expect(confirmed.status).toBe("confirmed");
  expect(confirmed.error).toBeUndefined();
  expect(read).toHaveBeenCalledTimes(2);
  for (const [request] of read.mock.calls)
    expect(request.blockNumber).toBe(BigInt(101));
});

test("fails when the receipt-block allowance is explicitly insufficient", async () => {
  const read = jest.spyOn(client, "readContract").mockResolvedValue(BigInt(2));
  await submitRepair();

  const [record] = await resumeStopLossApprovalRepair(account, 1);

  expect(record).toMatchObject({
    status: "failed",
    error: "Transaction completed without the required allowance",
  });
  expect(read).toHaveBeenCalledWith(
    expect.objectContaining({ blockNumber: BigInt(101) }),
  );
});

test("a reverted receipt fails without checking allowance", async () => {
  jest.spyOn(client, "waitForTransactionReceipt").mockResolvedValue({
    status: "reverted",
    transactionHash,
    blockNumber: BigInt(101),
  } as never);
  const read = jest.spyOn(client, "readContract").mockResolvedValue(BigInt(3));
  await submitRepair();

  const [record] = await resumeStopLossApprovalRepair(account, 1);

  expect(record).toMatchObject({
    status: "failed",
    error: "Transaction reverted",
  });
  expect(read).not.toHaveBeenCalled();
});

test("an unknown receipt outcome stays pending without checking allowance", async () => {
  jest
    .spyOn(client, "waitForTransactionReceipt")
    .mockRejectedValue(new Error("Receipt RPC unavailable"));
  const read = jest.spyOn(client, "readContract").mockResolvedValue(BigInt(3));
  await submitRepair();

  const [record] = await resumeStopLossApprovalRepair(account, 1);

  expect(record.status).toBe("pending");
  expect(read).not.toHaveBeenCalled();
});

test("preserves wallet rejection and does not read allowance", async () => {
  const read = jest.spyOn(client, "readContract").mockResolvedValue(BigInt(3));
  const rejection = Object.assign(new Error("User rejected request"), {
    code: 4001,
  });
  const tracker = getStopLossApprovalRepair();
  await expect(
    tracker.submit(prepared, work, async () => {
      throw rejection;
    }),
  ).rejects.toBe(rejection);

  const [record] = await resumeStopLossApprovalRepair(account, 1);

  expect(record).toMatchObject({
    status: "rejected",
    error: "User rejected request",
  });
  expect(read).not.toHaveBeenCalled();
});

test.each(["wallet", "settlement"] as const)(
  "confirms %s repair from the receipt block when implicit latest allowance is stale",
  async (stage) => {
    const read = jest
      .spyOn(client, "readContract")
      .mockImplementation(async ({ blockNumber }) =>
        blockNumber === BigInt(101) ? BigInt(3) : BigInt(0),
      );
    const tracker = getStopLossApprovalRepair();
    await tracker.submit(prepared, { ...work, stage }, async () => ({
      id: transactionHash,
      transactionHash,
    }));

    const [record] = await resumeStopLossApprovalRepair(account, 1);

    expect(record).toMatchObject({
      status: "confirmed",
      reference: { transactionHash, blockNumber: BigInt(101) },
    });
    expect(read).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "allowance",
        blockNumber: BigInt(101),
        args:
          stage === "wallet"
            ? [account, prepared.poller]
            : [prepared.owner, GPV2_VAULT_RELAYER_ADDRESS],
      }),
    );
  },
);
