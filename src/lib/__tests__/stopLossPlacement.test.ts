import { InsufficientFundsError } from "viem";

import { readStopLossTransaction } from "#/hooks/useStopLossPlacement";
import { STOP_LOSS_ADDRESS } from "#/lib/contracts";
import type { PreparedPlacement } from "#/lib/pollerStopLoss";
import { publicClientsFromIds } from "#/lib/publicClients";
import { encodeStopLossStaticInput } from "#/lib/staticInputEncoder";
import { createStopLossApprovalRepair } from "#/lib/stopLossApprovalRepair";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import type { TransactionReference } from "#/lib/stopLossPlacement";
import { createStopLossPlacement } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";

const account = "0x1111111111111111111111111111111111111111";
const scope = { account, chainId: 1 } as const;
const prepared: PreparedPlacement = {
  ...scope,
  owner: "0x4444444444444444444444444444444444444444",
  factory: "0x3333333333333333333333333333333333333333",
  poller: "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
  scheduleId: `0x${"aa".repeat(32)}`,
  paramsHash: `0x${"bb".repeat(32)}`,
  orderDigest: `0x${"cc".repeat(32)}`,
  domainSeparator: `0x${"dd".repeat(32)}`,
  appDataHash: `0x${"ee".repeat(32)}`,
  fullAppData: "{}",
  staticInput: "0x",
  draft: {
    id: "reviewed-order",
    tokenSell: {
      address: "0x6666666666666666666666666666666666666666",
      decimals: 18,
      symbol: "WETH",
    },
    tokenBuy: {
      address: "0x7777777777777777777777777777777777777777",
      decimals: 6,
      symbol: "USDC",
    },
    amountSell: "1",
    amountBuy: "1980",
    strikePrice: "2000",
    limitPrice: "1980",
    slippagePercent: "1",
    isSellOrder: true,
    receiver: account,
    partiallyFillable: true,
    maxHoursSinceOracleUpdates: 1,
    validTo: 1800003600,
    salt: `0x${"ab".repeat(32)}`,
    tokenSellOracle: "0x8888888888888888888888888888888888888888",
    tokenBuyOracle: "0x9999999999999999999999999999999999999999",
    oraclePrice: 2000,
    status: OrderStatus.DRAFT,
  },
};
prepared.staticInput = encodeStopLossStaticInput(
  prepared.draft,
  prepared.appDataHash,
);

const repairPrepared = { ...prepared, kind: "repair" as const };
const repairWork = {
  stage: "wallet" as const,
  target: BigInt(1),
  transaction: {
    account: prepared.account,
    chainId: 1 as const,
    to: prepared.draft.tokenSell.address,
    data: "0x" as const,
    value: BigInt(0),
  },
};

test("blocks a smaller repair while a persisted placement approval is unresolved", async () => {
  const env = environment();
  await createStopLossPlacement(env).submit(prepared, "approval", {
    approvalAmount: BigInt(3),
    send: async () => ({ id: "larger-approval" }),
  });
  const send = jest.fn(async () => ({ id: "smaller-approval" }));
  await expect(
    createStopLossApprovalRepair(env).submit(repairPrepared, repairWork, send),
  ).rejects.toThrow(/already active|pending/);
  expect(send).not.toHaveBeenCalled();
});

test("blocks placement while a persisted repair approval is unresolved", async () => {
  const env = environment();
  await createStopLossApprovalRepair(env).submit(
    repairPrepared,
    repairWork,
    async () => ({ id: "repair-approval" }),
  );
  const send = jest.fn(async () => ({ id: "placement-approval" }));
  await expect(
    createStopLossPlacement(env).submit(prepared, "approval", { send }),
  ).rejects.toThrow("already active");
  expect(send).not.toHaveBeenCalled();
});

test("persists placement transaction identity before its receipt wait finishes", async () => {
  const client = publicClientsFromIds[1];
  const transactionHash = `0x${"cd".repeat(32)}` as const;
  jest.spyOn(client, "getTransaction").mockResolvedValue({
    from: account,
    to: prepared.draft.tokenSell.address,
    input: "0x1234",
    value: BigInt(0),
    nonce: 7,
    blockNumber: null,
  } as never);
  jest.spyOn(client, "getBlockNumber").mockResolvedValue(BigInt(100));
  jest
    .spyOn(client, "getBlock")
    .mockResolvedValue({ transactions: [] } as never);
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  const receipt = jest
    .spyOn(client, "waitForTransactionReceipt")
    .mockImplementation(async () => {
      await waiting;
      return {
        status: "success",
        transactionHash,
        blockNumber: BigInt(101),
      } as never;
    });
  const env = environment();
  const placement = createStopLossPlacement(env);
  await placement.submit(prepared, "approval", {
    send: async () => ({ id: transactionHash, transactionHash }),
  });
  const task = placement.resume(scope, {
    readTransaction: (
      _record,
      reference,
      ...writers: ((reference: TransactionReference) => Promise<void>)[]
    ) => readStopLossTransaction(reference, client, writers[0]),
    checkState: async () => true,
  });
  try {
    while (!receipt.mock.calls.length)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(
      createStopLossPlacement(env).getPendingTransactions(scope)[0].transactions
        .approval?.submitted?.nonce,
    ).toBe(7);
  } finally {
    release();
    await task;
    jest.restoreAllMocks();
  }
});

test("rejects unsupported kinds before opening a wallet prompt", async () => {
  const placement = createStopLossPlacement(environment());
  let prompted = false;
  const unsupported = {
    ...prepared,
    draft: { ...prepared.draft, isSellOrder: false },
  } as unknown as PreparedPlacement;
  await expect(
    placement.submit(unsupported, "setup", {
      send: async () => {
        prompted = true;
        return { id: "must-not-send" };
      },
    }),
  ).rejects.toThrow("Only exact-sell orders are supported.");
  expect(prompted).toBe(false);
  expect(placement.getRecords(scope)).toEqual([]);
});

test("projects scheduled funding identity from the prepared placement account", async () => {
  const placement = createStopLossPlacement(environment());
  const receiver = "0x2222222222222222222222222222222222222222";
  const draft = { ...prepared.draft, receiver } as const;
  const reviewed = {
    ...prepared,
    draft,
    staticInput: encodeStopLossStaticInput(draft, prepared.appDataHash),
  };
  await placement.submit(reviewed, "setup", {
    send: async () => ({ id: "setup-transaction" }),
  });

  const rows = await placement.mergeRows(scope, []);

  expect(rows).toMatchObject([
    {
      source: "local",
      owner: prepared.owner,
      receiver,
      funding: {
        kind: "scheduled",
        funder: account,
        handler: STOP_LOSS_ADDRESS,
        salt: prepared.draft.salt,
        staticInput: reviewed.staticInput,
      },
    },
  ]);
});

function apiOrder(overrides: Partial<StopLossOrder> = {}): StopLossOrder {
  return {
    id: "indexed-order",
    parentId: "api-event-123",
    chainId: 1,
    owner: "0x4444444444444444444444444444444444444444",
    hash: `0x${"bb".repeat(32)}`,
    status: OrderStatus.FULFILLED,
    receiver: account,
    sellAmount: BigInt("1000000000000000000"),
    buyAmount: BigInt("1980000000"),
    validTo: 1800003600,
    sellToken: {
      address: "0x6666666666666666666666666666666666666666",
      decimals: 18,
      symbol: "WETH",
    },
    buyToken: {
      address: "0x7777777777777777777777777777777777777777",
      decimals: 6,
      symbol: "USDC",
    },
    strike: BigInt("2000000000000000000000"),
    partiallyFillable: true,
    isSellOrder: true,
    sellTokenPriceOracle: "0x8888888888888888888888888888888888888888",
    buyTokenPriceOracle: "0x9999999999999999999999999999999999999999",
    maxTimeSinceLastOracleUpdate: 3600,
    executedSellAmount: BigInt("1000000000000000000"),
    executedBuyAmount: BigInt("2000000000"),
    executedFee: BigInt(0),
    ...overrides,
  };
}

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

function sharedLocks() {
  const previous = new Map<string, Promise<unknown>>();
  return {
    request<T>(name: string, action: () => Promise<T> | T): Promise<T> {
      const result = (previous.get(name) ?? Promise.resolve()).then(action);
      previous.set(
        name,
        result.then(
          () => undefined,
          () => undefined,
        ),
      );
      return result;
    },
  };
}

function environment() {
  return { storage: memoryStorage(), locks: sharedLocks(), now: () => 1000 };
}

test("keeps the reviewed setup in memory until the wallet returns a reference", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "setup", {
    send: async () => {
      expect(placement.getRecords(scope)[0]).toMatchObject({
        prepared,
        status: "prompting",
      });
      expect(createStopLossPlacement(options).getRecords(scope)).toEqual([]);
      expect(options.storage.getItem("stop-loss-placement")).not.toContain(
        "draft",
      );
      return { id: "wallet-request-1" };
    },
  });
  expect(createStopLossPlacement(options).getRecords(scope)[0]).toMatchObject({
    prepared,
    status: "pending",
    transactions: { setup: { id: "wallet-request-1" } },
  });
});

test("polling during a wallet prompt preserves the returned transaction hash", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "setup", {
    send: async () => {
      await createStopLossPlacement(options).resume(scope, {
        checkState: async () => false,
      });
      return { id: "sent-tx", transactionHash: "0x1234" };
    },
  });
  expect(createStopLossPlacement(options).getRecords(scope)[0]).toMatchObject({
    status: "pending",
    transactions: { setup: { id: "sent-tx", transactionHash: "0x1234" } },
  });
});

test("allows one active placement per normalized wallet and chain across tabs", async () => {
  const options = environment();
  const firstTab = createStopLossPlacement(options);
  const secondTab = createStopLossPlacement(options);
  let walletRequests = 0;
  const adapter = {
    send: async () => {
      walletRequests += 1;
      return { id: "request" };
    },
  };
  const order = {
    ...prepared,
    account: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const,
  };
  const results = await Promise.allSettled([
    firstTab.submit(order, "setup", adapter),
    secondTab.submit(
      {
        ...order,
        account: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        paramsHash: `0x${"01".repeat(32)}`,
      },
      "setup",
      adapter,
    ),
  ]);
  expect(results.map((result) => result.status)).toEqual([
    "fulfilled",
    "rejected",
  ]);
  expect(walletRequests).toBe(1);
  expect(
    secondTab.getRecords({ ...scope, account: order.account }),
  ).toHaveLength(1);
});

test("a rejected first wallet prompt leaves no saved order after reload", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await expect(
    placement.submit(prepared, "approval", {
      send: async () => {
        throw Object.assign(new Error("User rejected request"), { code: 4001 });
      },
    }),
  ).rejects.toThrow("User rejected request");
  expect(createStopLossPlacement(options).getRecords(scope)).toEqual([]);
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "explicit-retry" }),
  });
  expect(placement.getRecords(scope)).toEqual([
    expect.objectContaining({ prepared, status: "pending" }),
  ]);
});

test("a rejected setup after approval releases the scope for a new review", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "approval", {
    send: async () => ({ id: "approved" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => {
        throw Object.assign(new Error("Rejected"), { code: 4001 });
      },
    }),
  ).rejects.toThrow("Rejected");
  expect(createStopLossPlacement(options).getRecords(scope)).toEqual([]);
  await placement.submit(
    { ...prepared, paramsHash: `0x${"01".repeat(32)}` },
    "setup",
    {
      send: async () => ({ id: "new-order" }),
    },
  );
  expect(placement.getRecords(scope)[0].transactions.setup?.id).toBe(
    "new-order",
  );
});

test("a failed allowance reset can retry the reset without changing the order", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "approval-reset", {
    send: async () => ({ id: "failed-reset" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "failed" }),
    checkState: async () => false,
  });
  await placement.submit(prepared, "approval-reset", {
    send: async () => ({ id: "retried-reset" }),
  });
  expect(placement.getRecords(scope)).toEqual([
    expect.objectContaining({
      prepared,
      status: "pending",
      transactions: { "approval-reset": { id: "retried-reset" } },
    }),
  ]);
});

test("a definite insufficient-funds submission failure releases the scope", async () => {
  const placement = createStopLossPlacement(environment());
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => {
        throw new Error("Gas estimation failed", {
          cause: new InsufficientFundsError(),
        });
      },
    }),
  ).rejects.toThrow("Gas estimation failed");
  expect(placement.getRecords(scope)).toEqual([]);
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "explicit-retry" }),
  });
  expect(placement.getRecords(scope).map((record) => record.status)).toEqual([
    "pending",
  ]);
});

test("reload reads postconditions without sending and a mined receipt alone stays pending", async () => {
  const options = environment();
  let walletRequests = 0;
  await createStopLossPlacement(options).submit(prepared, "setup", {
    send: async () => {
      walletRequests += 1;
      return { id: "opaque-wallet-reference" };
    },
  });
  const reloaded = createStopLossPlacement(options);
  await reloaded.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => false,
  });
  expect(reloaded.getRecords(scope)[0].status).toBe("pending");
  await reloaded.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  expect(reloaded.getRecords(scope)[0]).toMatchObject({
    status: "confirmed",
    confirmedAt: 1000,
  });
  expect(walletRequests).toBe(1);
  await reloaded.submit(
    { ...prepared, paramsHash: `0x${"02".repeat(32)}` },
    "setup",
    {
      send: async () => ({ id: "next-order" }),
    },
  );
  expect(reloaded.getRecords(scope).map((record) => record.status)).toEqual([
    "confirmed",
    "pending",
  ]);
});

test("sufficient allowance cannot resolve an approval with an unknown outcome", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "approval", {
    send: async () => ({ id: "approval-tx" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "pending" }),
    checkState: async () => true,
  });
  expect(placement.getRecords(scope)[0].status).toBe("pending");
});

test("a confirmed approval reset requires approval and never submits setup automatically", async () => {
  const placement = createStopLossPlacement(environment());
  const adapter = { send: async () => ({ id: "approval-reference" }) };
  await placement.submit(prepared, "approval-reset", adapter);
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  expect(placement.getRecords(scope)[0]).toMatchObject({
    stage: "approval-reset",
    status: "ready",
  });
  await expect(placement.submit(prepared, "setup", adapter)).rejects.toThrow(
    "Approval is required after a reset",
  );
  await placement.submit(prepared, "approval", adapter);
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  expect(placement.getRecords(scope)[0]).toMatchObject({
    stage: "approval",
    status: "ready",
  });
  await placement.submit(prepared, "setup", adapter);
  expect(placement.getRecords(scope)).toEqual([
    expect.objectContaining({
      stage: "setup",
      status: "pending",
      transactions: {
        "approval-reset": { id: "approval-reference" },
        approval: { id: "approval-reference" },
        setup: { id: "approval-reference" },
      },
    }),
  ]);
});

test("polling preserves an unknown submission error until creation is confirmed", async () => {
  const placement = createStopLossPlacement(environment());
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => {
        throw new Error(
          "Wallet response lost. Transaction outcome is unknown.",
        );
      },
    }),
  ).rejects.toThrow("Transaction outcome is unknown");
  await placement.resume(scope, { checkState: async () => false });
  expect(placement.getRecords(scope)[0]).toMatchObject({
    status: "prompting",
    error: "Wallet response lost. Transaction outcome is unknown.",
  });
  await placement.resume(scope, { checkState: async () => true });
  expect(placement.getRecords(scope)[0]).toMatchObject({ status: "confirmed" });
  expect(placement.getRecords(scope)[0].error).toBeUndefined();
});

test("RPC errors keep the submitted order pending and retry only reads", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "tx-1" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => {
      throw new Error("RPC unavailable");
    },
    checkState: async () => true,
  });
  expect(placement.getRecords(scope)[0]).toMatchObject({
    status: "pending",
    error: "RPC unavailable",
  });
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => ({ id: "wrong-resubmission" }),
    }),
  ).rejects.toThrow("already active");
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  expect(placement.getRecords(scope)[0]).toMatchObject({ status: "confirmed" });
  expect(placement.getRecords(scope)[0].error).toBeUndefined();
});

test("created postconditions confirm the order despite a failed setup receipt", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  const send = jest.fn(async () => ({ id: "cancelled-setup" }));
  await placement.submit(prepared, "setup", { send });
  await createStopLossPlacement(options).resume(scope, {
    readTransaction: async () => ({
      status: "failed",
      error: "Transaction cancelled",
    }),
    checkState: async () => true,
  });
  expect(placement.getConfirmedPlacements(scope)).toEqual([prepared]);
  expect(await placement.mergeRows(scope, [])).toEqual([
    expect.objectContaining({
      source: "local",
      status: OrderStatus.OPEN,
      hash: prepared.paramsHash,
    }),
  ]);
  expect(send).toHaveBeenCalledTimes(1);
});

test("a confirmed transaction failure permits a new explicit submission", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "failed-tx" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({
      status: "failed",
      error: "Transaction reverted",
    }),
    checkState: async () => false,
  });
  expect(placement.getRecords(scope)[0]).toMatchObject({
    status: "failed",
    error: "Transaction reverted",
  });
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "next-tx" }),
  });
  expect(placement.getRecords(scope).map((record) => record.status)).toEqual([
    "pending",
  ]);
});

test("an old approval check cannot update a later setup stage", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "approval", {
    send: async () => ({ id: "approval-tx" }),
  });
  let finish!: (confirmed: boolean) => void;
  const delayed = new Promise<boolean>((resolve) => {
    finish = resolve;
  });
  const staleRead = placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => delayed,
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "setup-tx" }),
  });
  finish(true);
  await staleRead;
  expect(placement.getRecords(scope)[0]).toMatchObject({
    stage: "setup",
    status: "pending",
  });
  expect(placement.getRecords(scope)[0].confirmedAt).toBeUndefined();
});

test("transaction references with bigint block numbers survive reload", async () => {
  const options = environment();
  await createStopLossPlacement(options).submit(prepared, "setup", {
    send: async () => ({
      id: "transaction",
      transactionHash: "0x1234",
      blockNumber: BigInt("20000001"),
    }),
  });
  expect(
    createStopLossPlacement(options).getRecords(scope)[0].transactions.setup,
  ).toEqual({
    id: "transaction",
    transactionHash: "0x1234",
    blockNumber: BigInt("20000001"),
  });
});

test("a replacement transaction reference is saved while execution stays pending", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "original" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({
      status: "pending",
      reference: { id: "replacement", transactionHash: "0xabcd" },
    }),
    checkState: async () => false,
  });
  expect(createStopLossPlacement(options).getRecords(scope)[0]).toMatchObject({
    status: "pending",
    transactions: { setup: { id: "replacement", transactionHash: "0xabcd" } },
  });
});

test("wallet callbacks and form edits cannot change the persisted prepared snapshot", async () => {
  const placement = createStopLossPlacement(environment());
  const review = { ...prepared, draft: { ...prepared.draft } };
  await placement.submit(review, "setup", {
    send: async (record) => {
      review.draft.amountSell = "5";
      record.prepared.draft.amountBuy = "1";
      return { id: "tx" };
    },
  });
  expect(placement.getRecords(scope)[0].prepared.draft).toMatchObject({
    amountSell: "1",
    amountBuy: "1980",
  });
});

test("an older RPC error cannot overwrite a newer pending transaction read", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "original" }),
  });
  let fail!: (error: Error) => void;
  const delayed = new Promise<never>((_resolve, reject) => {
    fail = reject;
  });
  const stale = placement.resume(scope, {
    readTransaction: async () => delayed,
    checkState: async () => false,
  });
  await placement.resume(scope, {
    readTransaction: async () => ({
      status: "pending",
      reference: { id: "newer" },
    }),
    checkState: async () => false,
  });
  fail(new Error("Old RPC error"));
  await stale;
  expect(placement.getRecords(scope)[0].error).toBeUndefined();
  expect(placement.getRecords(scope)[0].transactions.setup).toEqual({
    id: "newer",
  });
});

test("confirmed funding snapshots stay isolated from other wallets and chains", async () => {
  const placement = createStopLossPlacement(environment());
  const otherWallet = {
    ...prepared,
    account: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const,
  };
  const otherChain = { ...prepared, chainId: 100 as const };
  const adapter = { send: async () => ({ id: "request" }) };
  await Promise.all([
    placement.submit(prepared, "setup", adapter),
    placement.submit(otherWallet, "setup", adapter),
    placement.submit(otherChain, "setup", adapter),
  ]);
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  expect(placement.getConfirmedPlacements(scope)).toEqual([prepared]);
  expect(placement.getConfirmedPlacements(otherWallet)).toEqual([]);
  expect(placement.getConfirmedPlacements(otherChain)).toEqual([]);
  expect(placement.getRecords(otherWallet)[0].status).toBe("pending");
  expect(placement.getRecords(otherChain)[0].status).toBe("pending");
});

test("unsigned setup requests stay out of the table until the wallet accepts them", async () => {
  const placement = createStopLossPlacement(environment());
  let sign!: (reference: { id: string }) => void;
  const submission = placement.submit(prepared, "setup", {
    send: async () =>
      new Promise((resolve) => {
        sign = resolve;
      }),
  });
  while (!sign) await Promise.resolve();
  expect(placement.getRecords(scope)[0].status).toBe("prompting");
  expect(await placement.mergeRows(scope, [])).toEqual([]);
  sign({ id: "signed-setup" });
  await submission;
  expect(await placement.mergeRows(scope, [])).toHaveLength(1);
});

test("token approval alone does not add an order to the table", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "approval", {
    send: async () => ({ id: "signed-approval" }),
  });
  expect(await placement.mergeRows(scope, [])).toEqual([]);
});

test("local rows are pending until verified, then Open without an API detail link", async () => {
  const placement = createStopLossPlacement(environment());
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "tx" }),
  });
  const [pending] = await placement.mergeRows(scope, []);
  expect(pending).toMatchObject({
    source: "local",
    canLink: false,
    status: OrderStatus.CREATING,
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  const [confirmed] = await placement.mergeRows(scope, []);
  expect(confirmed).toMatchObject({
    source: "local",
    canLink: false,
    status: OrderStatus.OPEN,
    chainId: 1,
    owner: prepared.owner,
    hash: prepared.paramsHash,
    sellAmount: BigInt("1000000000000000000"),
    buyAmount: BigInt("1980000000"),
    receiver: account,
    validTo: 1800003600,
    partiallyFillable: true,
  });
  expect(placement.getConfirmedPlacements(scope)).toEqual([prepared]);
});

test("five minutes without indexing shows the exact API error after reload and keeps funding active", async () => {
  let time = 1000;
  const options = { ...environment(), now: () => time };
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "tx" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  time = 300999;
  expect((await placement.mergeRows(scope, []))[0]).not.toHaveProperty(
    "error",
    "API error: confirmed order not found.",
  );
  time = 301000;
  const reloaded = createStopLossPlacement(options);
  expect((await reloaded.mergeRows(scope, []))[0]).toMatchObject({
    status: OrderStatus.OPEN,
    error: "API error: confirmed order not found.",
  });
  expect(reloaded.getConfirmedPlacements(scope)).toEqual([prepared]);
});

test("the indexed API replacement removes the confirmed local record by canonical identity", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "wallet-id-unrelated-to-api" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  const indexed = apiOrder({ hash: `0x${"BB".repeat(32)}` });
  expect(await placement.mergeRows(scope, [indexed])).toEqual([
    { ...indexed, source: "api", canLink: true },
  ]);
  expect(createStopLossPlacement(options).getRecords(scope)).toEqual([]);
  expect(placement.getConfirmedPlacements(scope)).toEqual([]);
});

test("subscribers can read placement updates without loops and receive other-tab storage changes", async () => {
  const events = new EventTarget();
  const options = { ...environment(), events };
  const placement = createStopLossPlacement(options);
  const observer = createStopLossPlacement(options);
  const localUpdates: string[] = [];
  const remoteUpdates: string[] = [];
  const stopLocal = placement.subscribe(() => {
    localUpdates.push(placement.getRecords(scope)[0].status);
  });
  const stopRemote = observer.subscribe(() => {
    remoteUpdates.push(observer.getRecords(scope)[0].status);
  });
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "tx" }),
  });
  events.dispatchEvent(
    Object.assign(new Event("storage"), { key: "stop-loss-placement" }),
  );
  expect(localUpdates).toEqual(["prompting", "pending"]);
  expect(remoteUpdates).toEqual(["pending"]);
  stopLocal();
  stopRemote();
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  events.dispatchEvent(
    Object.assign(new Event("storage"), { key: "stop-loss-placement" }),
  );
  expect(localUpdates).toEqual(["prompting", "pending"]);
  expect(remoteUpdates).toEqual(["pending"]);
});

test("persists approval metadata only after submission and drops it after completion", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "approval", {
    approvalAmount: BigInt(3),
    send: async () => {
      expect(
        createStopLossPlacement(options).getPendingTransactions(scope),
      ).toEqual([]);
      return { id: "approval-tx" };
    },
  });
  const reloaded = createStopLossPlacement(options);
  expect(reloaded.getRecords(scope)).toEqual([]);
  expect(reloaded.getPendingTransactions(scope)[0]).toMatchObject({
    token: prepared.draft.tokenSell.address,
    poller: prepared.poller,
    approvalAmount: BigInt(3),
  });
  expect(options.storage.getItem("stop-loss-placement")).not.toContain("draft");
  await reloaded.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  expect(reloaded.getPendingTransactions(scope)).toEqual([]);
  await reloaded.submit(
    { ...prepared, paramsHash: `0x${"01".repeat(32)}` },
    "setup",
    {
      send: async () => ({ id: "new-setup" }),
    },
  );
});

test("a wallet rejection nested inside an adapter error releases the scope", async () => {
  const placement = createStopLossPlacement(environment());
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => {
        throw Object.assign(new Error("Wallet action failed"), {
          cause: { code: 4001 },
        });
      },
    }),
  ).rejects.toThrow("Wallet action failed");
  expect(placement.getRecords(scope)).toEqual([]);
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "retry" }),
  });
  expect(await placement.mergeRows(scope, [])).toHaveLength(1);
});

test("a named user rejection without a numeric code releases the scope", async () => {
  const placement = createStopLossPlacement(environment());
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => {
        throw Object.assign(new Error("Rejected"), {
          name: "UserRejectedRequestError",
        });
      },
    }),
  ).rejects.toThrow("Rejected");
  expect(placement.getRecords(scope)).toEqual([]);
});

test("browsers without Web Locks can merge read-only rows but cannot open a wallet prompt", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "setup", {
    send: async () => ({ id: "tx" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  const reader = createStopLossPlacement({ storage: options.storage });
  expect((await reader.mergeRows(scope, []))[0]).toMatchObject({
    source: "local",
    status: OrderStatus.OPEN,
  });
  const indexed = apiOrder();
  expect(await reader.mergeRows(scope, [indexed])).toEqual([
    { ...indexed, source: "api", canLink: true },
  ]);
  expect(reader.getConfirmedPlacements(scope)).toEqual([prepared]);
  let prompted = false;
  await expect(
    reader.submit(
      { ...prepared, paramsHash: `0x${"04".repeat(32)}` },
      "setup",
      {
        send: async () => {
          prompted = true;
          return { id: "must-not-send" };
        },
      },
    ),
  ).rejects.toThrow("This browser does not support Web Locks");
  expect(prompted).toBe(false);
});

test("a ready approval can be explicitly reset and increased after funding checks change", async () => {
  const placement = createStopLossPlacement(environment());
  const send = async () => ({ id: "approval" });
  await placement.submit(prepared, "approval", {
    approvalAmount: BigInt(3),
    send,
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  await placement.submit(prepared, "approval-reset", { send });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  await placement.submit(prepared, "approval", {
    approvalAmount: BigInt(4),
    send,
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  await placement.submit(prepared, "approval", {
    approvalAmount: BigInt(5),
    send,
  });
  expect(placement.getRecords(scope)).toEqual([
    expect.objectContaining({
      stage: "approval",
      status: "pending",
      approvalAmount: BigInt(5),
    }),
  ]);
});

test("repeated API entries with different event ids produce one canonical row", async () => {
  const placement = createStopLossPlacement(environment());
  const indexed = apiOrder();
  const duplicate = apiOrder({ id: "another-event-id" });
  const rows = await placement.mergeRows(scope, [indexed, duplicate]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    source: "api",
    chainId: 1,
    owner: prepared.owner,
    hash: prepared.paramsHash,
  });
});

test("an unsupported persisted version blocks placement instead of clearing the active lock", async () => {
  let walletRequests = 0;
  const placement = createStopLossPlacement({
    ...environment(),
    storage: {
      getItem: () => '{"version":99,"state":{"records":[]}}',
      setItem: () => {
        throw new Error("Must not overwrite unknown data");
      },
      removeItem: () => {
        throw new Error("Must not remove unknown data");
      },
    },
  });
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => {
        walletRequests += 1;
        return { id: "must-not-send" };
      },
    }),
  ).rejects.toThrow("Unsupported placement storage version");
  expect(walletRequests).toBe(0);
});

test("cleans legacy drafts, converts pending approvals, and preserves submitted setups", async () => {
  const options = environment();
  const record = (
    id: string,
    stage: string,
    status: string,
    transactions = {},
  ) => ({
    id,
    revision: 0,
    prepared,
    stage,
    status,
    transactions,
  });
  options.storage.setItem(
    "stop-loss-placement",
    JSON.stringify({
      version: 1,
      state: {
        records: [
          record("unsigned", "setup", "prompting"),
          record("ready", "approval", "ready", {
            approval: { id: "approved" },
          }),
          record("failed", "approval-reset", "failed", {
            "approval-reset": { id: "failed" },
          }),
          record("rejected", "approval", "rejected"),
          record("pending", "approval", "pending", {
            approval: { id: "pending-approval" },
          }),
          record("submitted", "setup", "pending", { setup: { id: "setup" } }),
          record("confirmed", "setup", "confirmed", {
            setup: { id: "confirmed" },
          }),
        ],
      },
    }),
  );
  const placement = createStopLossPlacement(options);
  expect(placement.getRecords(scope).map(({ id }) => id)).toEqual([
    "submitted",
    "confirmed",
  ]);
  expect(placement.getPendingTransactions(scope)).toEqual([
    expect.objectContaining({
      id: "pending",
      token: prepared.draft.tokenSell.address,
    }),
  ]);
  await placement.cleanup();
  const saved = JSON.parse(options.storage.getItem("stop-loss-placement")!);
  expect(saved.state.records.map(({ id }: { id: string }) => id)).toEqual([
    "submitted",
    "confirmed",
  ]);
  expect(saved.state.pendingTransactions[0]).not.toHaveProperty("prepared");
  expect(saved.state.pendingTransactions[0]).not.toHaveProperty("draft");
  expect(saved.state.pendingTransactions[0]).not.toHaveProperty("staticInput");
});

test("holds the scope lock through wallet submission and saving its reference", async () => {
  const options = environment();
  const first = createStopLossPlacement(options);
  const second = createStopLossPlacement(options);
  let finish!: (reference: { id: string }) => void;
  const submission = first.submit(prepared, "approval", {
    send: async () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  while (!finish) await Promise.resolve();
  const send = jest.fn(async () => ({ id: "duplicate" }));
  const duplicate = second.submit(prepared, "setup", { send });
  const rejected = expect(duplicate).rejects.toThrow("already active");
  await Promise.resolve();
  expect(send).not.toHaveBeenCalled();
  expect(options.storage.getItem("stop-loss-placement")).not.toContain("draft");
  finish({ id: "approval" });
  await submission;
  await rejected;
  expect(send).not.toHaveBeenCalled();
  expect(
    second.getPendingTransactions(scope)[0].transactions.approval?.id,
  ).toBe("approval");
});

test("uncertain setup outcomes persist only a guard and resolve without a recovered order", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await expect(
    placement.submit(prepared, "setup", {
      send: async () => {
        throw new Error("Wallet response lost");
      },
    }),
  ).rejects.toThrow("Wallet response lost");
  const raw = options.storage.getItem("stop-loss-placement")!;
  for (const field of [
    "draft",
    "prepared",
    "staticInput",
    "fullAppData",
    "amountSell",
  ])
    expect(raw).not.toContain(field);
  const reloaded = createStopLossPlacement(options);
  expect(reloaded.getRecords(scope)).toEqual([]);
  expect(reloaded.getPendingTransactions(scope)[0]).toMatchObject({
    uncertain: true,
    setup: { owner: prepared.owner, paramsHash: prepared.paramsHash },
  });
  const send = jest.fn(async () => ({ id: "duplicate" }));
  await expect(reloaded.submit(prepared, "setup", { send })).rejects.toThrow(
    "already active",
  );
  expect(send).not.toHaveBeenCalled();
  await reloaded.resume(scope, { checkState: async () => false });
  expect(reloaded.getPendingTransactions(scope)).toHaveLength(1);
  await reloaded.resume(scope, { checkState: async () => true });
  expect(reloaded.getPendingTransactions(scope)).toEqual([]);
  expect(reloaded.getRecords(scope)).toEqual([]);
  expect(await reloaded.mergeRows(scope, [])).toEqual([]);
});

test("failed approval metadata releases the scope after reload", async () => {
  const options = environment();
  await createStopLossPlacement(options).submit(prepared, "approval", {
    send: async () => ({ id: "approval" }),
  });
  const reloaded = createStopLossPlacement(options);
  await reloaded.resume(scope, {
    readTransaction: async () => ({ status: "failed" }),
    checkState: async () => false,
  });
  expect(reloaded.getPendingTransactions(scope)).toEqual([]);
  await reloaded.submit(prepared, "setup", {
    send: async () => ({ id: "fresh" }),
  });
  expect(reloaded.getRecords(scope)[0].transactions.setup?.id).toBe("fresh");
});

test("a completed live approval does not block a different reviewed order", async () => {
  const options = environment();
  const placement = createStopLossPlacement(options);
  await placement.submit(prepared, "approval", {
    send: async () => ({ id: "approval" }),
  });
  await placement.resume(scope, {
    readTransaction: async () => ({ status: "success" }),
    checkState: async () => true,
  });
  expect(placement.getRecords(scope)[0].status).toBe("ready");
  expect(createStopLossPlacement(options).getRecords(scope)).toEqual([]);
  await placement.submit(
    { ...prepared, paramsHash: `0x${"01".repeat(32)}` },
    "setup",
    {
      send: async () => ({ id: "different-order" }),
    },
  );
  expect(
    placement
      .getRecords(scope)
      .some((record) => record.transactions.setup?.id === "different-order"),
  ).toBe(true);
});

test("legacy reads are read-only and durable cleanup holds the storage lock", async () => {
  const storage = memoryStorage();
  storage.setItem(
    "stop-loss-placement",
    JSON.stringify({
      version: 1,
      state: {
        records: [
          {
            id: "old-review",
            revision: 0,
            prepared,
            stage: "approval",
            status: "ready",
            transactions: {},
          },
        ],
      },
    }),
  );
  let held = false;
  const setItem = jest.fn((key: string, value: string) => {
    expect(held).toBe(true);
    storage.setItem(key, value);
  });
  const placement = createStopLossPlacement({
    storage: { ...storage, setItem },
    locks: {
      request: async (_name, action) => {
        held = true;
        try {
          return await action();
        } finally {
          held = false;
        }
      },
    },
  });
  expect(placement.getRecords(scope)).toEqual([]);
  expect(setItem).not.toHaveBeenCalled();
  await placement.cleanup();
  expect(setItem).toHaveBeenCalledTimes(1);
  expect(JSON.parse(storage.getItem("stop-loss-placement")!).version).toBe(2);
});
