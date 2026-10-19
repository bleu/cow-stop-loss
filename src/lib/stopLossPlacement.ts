import type { Address, Hex } from "viem";
import { InsufficientFundsError } from "viem";
import { createJSONStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { PreparedPlacement } from "./pollerStopLoss";
import type { ChainId } from "./publicClients";
import type { SafePlacementRecord } from "./safeStopLossPlacement";
import { decodeStopLossStaticInput } from "./staticInputDecoder";
import type { StopLossOrder } from "./stopLossOrders";
import { OrderStatus } from "./types";

export type PlacementScope = { account: Address; chainId: ChainId };
export type PlacementStage = "approval-reset" | "approval" | "setup";
export type TransactionReference = {
  id: string;
  transactionHash?: Hex;
  blockNumber?: bigint;
  submitted?: {
    from: Address;
    to: Address | null;
    input: Hex;
    value: bigint;
    nonce: number;
    nextBlock: bigint;
  };
  replacementError?: string;
};
export type PlacementRecord = {
  id: string;
  revision: number;
  attempt?: string;
  prepared: PreparedPlacement;
  stage: PlacementStage;
  status:
    | "prompting"
    | "pending"
    | "failed"
    | "rejected"
    | "confirmed"
    | "ready";
  confirmedAt?: number;
  approvalAmount?: bigint;
  settlementAmount?: bigint;
  error?: string;
  transactions: Partial<Record<PlacementStage, TransactionReference>>;
};
export type PlacementLocks = {
  request<T>(name: string, action: () => Promise<T> | T): Promise<T>;
};
export type PlacementOptions = {
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  locks?: PlacementLocks;
  now?: () => number;
  events?: Pick<EventTarget, "addEventListener" | "removeEventListener">;
};
export type PlacementSender = {
  approvalAmount?: bigint;
  settlementAmount?: bigint;
  send(record: PlacementRecord): Promise<TransactionReference>;
};
export type PlacementReader = {
  readTransaction?(
    record: PlacementRecord,
    reference: TransactionReference,
    saveReference?: (reference: TransactionReference) => Promise<void>,
  ): Promise<{
    status: "pending" | "success" | "failed";
    error?: string;
    reference?: TransactionReference;
  }>;
  checkState(record: PlacementRecord): Promise<boolean>;
};

export type PlacementRow = StopLossOrder &
  (
    | { source: "api"; canLink: true }
    | {
        source: "safe";
        canLink: false;
        safePlacement: SafePlacementRecord;
        error?: string;
      }
    | {
        source: "local";
        canLink: false;
        placement: PlacementRecord;
        error?: string;
      }
  );

export function isRejected(error: unknown): boolean {
  const seen = new Set<object>();
  while (error && typeof error === "object" && !seen.has(error)) {
    seen.add(error);
    if (
      ("code" in error && error.code === 4001) ||
      ("name" in error && error.name === "UserRejectedRequestError")
    )
      return true;
    error = "cause" in error ? error.cause : undefined;
  }
  return false;
}

export class PlacementNotSubmittedError extends Error {}

export function isDefiniteFailure(error: unknown): boolean {
  const seen = new Set<object>();
  while (error && typeof error === "object" && !seen.has(error)) {
    seen.add(error);
    if (
      error instanceof PlacementNotSubmittedError ||
      error instanceof InsufficientFundsError
    )
      return true;
    error = "cause" in error ? error.cause : undefined;
  }
  return false;
}

const storageName = "stop-loss-placement";

export function withStopLossSubmission<T>(
  scope: PlacementScope,
  flow: "placement" | "repair",
  options: Required<Pick<PlacementOptions, "storage">> &
    Pick<PlacementOptions, "locks">,
  action: () => T | Promise<T>,
): Promise<T> {
  if (!options.locks)
    throw new Error(
      "This browser does not support Web Locks. Submission is unavailable.",
    );
  return options.locks.request(
    `stop-loss-submission:${scope.chainId}:${scope.account.toLowerCase()}`,
    () => {
      const otherKey =
        flow === "placement" ? "stop-loss-approval-repair" : storageName;
      const raw = options.storage.getItem(otherKey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          version: number;
          state: {
            records: {
              prepared: PlacementScope;
              status: PlacementRecord["status"];
            }[];
          };
        };
        if (saved.version !== 1)
          throw new Error("Unsupported stop-loss submission storage version");
        if (
          saved.state.records.some(
            ({ prepared, status }) =>
              prepared.chainId === scope.chainId &&
              prepared.account.toLowerCase() === scope.account.toLowerCase() &&
              (flow === "repair"
                ? status !== "confirmed"
                : status === "pending" || status === "prompting"),
          )
        )
          throw new Error(
            "A stop-loss transaction is already active for this wallet and chain",
          );
      }
      return action();
    },
  );
}

export function createStopLossPlacement({
  storage = localStorage,
  locks = typeof navigator === "undefined" ? undefined : navigator.locks,
  now = Date.now,
  events = typeof window === "undefined" ? undefined : window,
}: PlacementOptions = {}) {
  const jsonStorage = createJSONStorage<{ records: PlacementRecord[] }>(
    () => storage,
    {
      replacer: (_key, value) =>
        typeof value === "bigint" ? { __bigint: value.toString() } : value,
      reviver: (_key, value) =>
        value &&
        typeof value === "object" &&
        "__bigint" in value &&
        typeof value.__bigint === "string"
          ? BigInt(value.__bigint)
          : value,
    },
  )!;
  const state = createStore(() => ({ records: [] as PlacementRecord[] }));
  let snapshot: string | null | undefined;

  function read() {
    const raw = storage.getItem(storageName);
    if (snapshot === raw) return state.getState().records;
    const saved = jsonStorage.getItem(storageName);
    if (saved instanceof Promise)
      throw new Error("Placement storage must be synchronous");
    if (saved && saved.version !== 1)
      throw new Error("Unsupported placement storage version");
    snapshot = raw;
    state.setState({ records: saved?.state.records ?? [] });
    return state.getState().records;
  }

  function save(records: PlacementRecord[]) {
    jsonStorage.setItem(storageName, { state: { records }, version: 1 });
    snapshot = storage.getItem(storageName);
    state.setState({ records });
  }

  function getRecords(scope: PlacementScope) {
    return structuredClone(
      read().filter(
        (record) =>
          record.prepared.chainId === scope.chainId &&
          record.prepared.account.toLowerCase() === scope.account.toLowerCase(),
      ),
    );
  }

  function locked<T>(action: () => T | Promise<T>) {
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Placement is unavailable.",
      );
    return locks.request(storageName, action);
  }

  async function submit(
    prepared: PreparedPlacement,
    stage: PlacementStage,
    adapter: PlacementSender,
  ) {
    if (
      prepared.draft.isSellOrder !== true ||
      !decodeStopLossStaticInput(prepared.staticInput).isSellOrder
    )
      throw new Error("Only exact-sell orders are supported.");
    prepared = structuredClone(prepared);
    getRecords(prepared);
    const record = await withStopLossSubmission(
      prepared,
      "placement",
      { storage, locks },
      () =>
        locked(() => {
          const active = getRecords(prepared).find(
            (entry) => entry.status !== "confirmed",
          );
          if (active) {
            if (
              (active.status !== "ready" &&
                active.status !== "failed" &&
                active.status !== "rejected") ||
              active.prepared.paramsHash.toLowerCase() !==
                prepared.paramsHash.toLowerCase()
            ) {
              throw new Error(
                "A placement is already active for this wallet and chain",
              );
            }
            if (active.stage === "approval-reset" && stage === "setup")
              throw new Error("Approval is required after a reset");
            const next: PlacementRecord = {
              ...active,
              revision: active.revision + 1,
              attempt: crypto.randomUUID(),
              stage,
              status: "prompting",
              error: undefined,
              settlementAmount:
                stage === "setup"
                  ? adapter.settlementAmount
                  : active.settlementAmount,
              approvalAmount:
                stage === "approval"
                  ? adapter.approvalAmount
                  : active.approvalAmount,
            };
            save(
              read().map((entry) => (entry.id === active.id ? next : entry)),
            );
            return next;
          }
          const entry: PlacementRecord = {
            id: crypto.randomUUID(),
            revision: 0,
            attempt: crypto.randomUUID(),
            prepared,
            stage,
            status: "prompting",
            settlementAmount:
              stage === "setup" ? adapter.settlementAmount : undefined,
            approvalAmount:
              stage === "approval" ? adapter.approvalAmount : undefined,
            transactions: {},
          };
          save([...read(), entry]);
          return entry;
        }),
    );
    const isCurrentAttempt = (entry: PlacementRecord) =>
      entry.id === record.id &&
      entry.stage === record.stage &&
      entry.attempt === record.attempt;
    let reference: TransactionReference;
    try {
      reference = await adapter.send(structuredClone(record));
    } catch (error) {
      const rejected = isRejected(error);
      await locked(() =>
        save(
          read().flatMap((entry) => {
            if (!isCurrentAttempt(entry) || entry.status === "confirmed")
              return [entry];
            if (
              (rejected || isDefiniteFailure(error)) &&
              !Object.values(entry.transactions).some(Boolean)
            )
              return [];
            return [
              {
                ...entry,
                revision: entry.revision + 1,
                status: rejected
                  ? ("rejected" as const)
                  : isDefiniteFailure(error)
                    ? ("failed" as const)
                    : entry.status,
                error: error instanceof Error ? error.message : String(error),
              },
            ];
          }),
        ),
      );
      throw error;
    }
    await locked(() =>
      save(
        read().map((entry) =>
          isCurrentAttempt(entry)
            ? {
                ...entry,
                revision: entry.revision + 1,
                status: entry.status === "prompting" ? "pending" : entry.status,
                transactions: { ...entry.transactions, [stage]: reference },
              }
            : entry,
        ),
      ),
    );
    return getRecords(prepared).find((entry) => entry.id === record.id);
  }

  async function resume(scope: PlacementScope, adapter: PlacementReader) {
    for (const record of getRecords(scope)) {
      if (record.status !== "pending" && record.status !== "prompting")
        continue;
      let reference = record.transactions[record.stage];
      if (record.stage !== "setup" && record.status === "prompting") continue;
      try {
        let transactionSucceeded = false;
        let created = false;
        if (
          record.status !== "prompting" &&
          reference &&
          adapter.readTransaction
        ) {
          const receipt = await adapter.readTransaction(
            record,
            reference,
            async (next) => {
              await locked(() =>
                save(
                  read().map((entry) =>
                    entry.id === record.id && entry.revision === record.revision
                      ? {
                          ...entry,
                          transactions: {
                            ...entry.transactions,
                            [record.stage]: next,
                          },
                        }
                      : entry,
                  ),
                ),
              );
            },
          );
          transactionSucceeded = receipt.status === "success";
          reference = receipt.reference ?? reference;
          if (receipt.status === "pending" && receipt.error)
            throw new Error(receipt.error);
          if (receipt.status === "failed" && record.stage === "setup")
            created = await adapter.checkState(record);
          if (receipt.status === "failed" && !created) {
            await locked(() =>
              save(
                read().map((entry) =>
                  entry.id === record.id && entry.revision === record.revision
                    ? {
                        ...entry,
                        revision: entry.revision + 1,
                        status: "failed",
                        error: receipt.error ?? "Transaction failed",
                        transactions: {
                          ...entry.transactions,
                          [record.stage]: reference,
                        },
                      }
                    : entry,
                ),
              ),
            );
            continue;
          }
        }
        const confirmed =
          created ||
          ((record.stage === "setup" || transactionSucceeded) &&
            (await adapter.checkState(record)));
        const allowanceChanged =
          record.stage !== "setup" && transactionSucceeded && !confirmed;
        await locked(() =>
          save(
            read().map((entry) =>
              entry.id === record.id && entry.revision === record.revision
                ? {
                    ...entry,
                    revision: entry.revision + 1,
                    status: confirmed
                      ? record.stage === "setup"
                        ? "confirmed"
                        : "ready"
                      : allowanceChanged
                        ? "failed"
                        : entry.status,
                    confirmedAt:
                      confirmed && record.stage === "setup" ? now() : undefined,
                    transactions: {
                      ...entry.transactions,
                      [record.stage]: reference,
                    },
                    error: allowanceChanged
                      ? "Approval completed, but allowance changed. Review the order again."
                      : !confirmed && entry.status === "prompting"
                        ? entry.error
                        : undefined,
                  }
                : entry,
            ),
          ),
        );
      } catch (error) {
        await locked(() =>
          save(
            read().map((entry) =>
              entry.id === record.id && entry.revision === record.revision
                ? {
                    ...entry,
                    revision: entry.revision + 1,
                    error:
                      error instanceof Error ? error.message : String(error),
                    transactions: {
                      ...entry.transactions,
                      [record.stage]: reference,
                    },
                  }
                : entry,
            ),
          ),
        );
      }
    }
    return getRecords(scope);
  }

  async function abandon(
    scope: PlacementScope,
    id: string,
    adapter: PlacementReader,
  ) {
    await resume(scope, adapter);
    const record = getRecords(scope).find((entry) => entry.id === id);
    if (!record || record.status === "confirmed") return;
    if (record.status === "prompting" || record.status === "pending")
      throw new Error(
        "Transaction outcome is unknown. Placement cannot be abandoned.",
      );
    const created = await adapter.checkState({ ...record, stage: "setup" });
    if (!created) {
      for (const [stage, reference] of Object.entries(record.transactions)) {
        if (!reference) continue;
        const receipt = await adapter.readTransaction?.(
          { ...record, stage: stage as PlacementStage },
          reference,
        );
        if (!receipt || receipt.status === "pending")
          throw new Error(
            "Transaction outcome is unknown. Placement cannot be abandoned.",
          );
      }
    }
    await locked(() => {
      const current = getRecords(scope).find((entry) => entry.id === id);
      if (!current) return;
      if (current.revision !== record.revision)
        throw new Error("Placement changed. Check it again.");
      save(
        read().flatMap((entry) =>
          entry.id !== id
            ? [entry]
            : created
              ? [
                  {
                    ...entry,
                    revision: entry.revision + 1,
                    status: "confirmed" as const,
                    confirmedAt: now(),
                    error: undefined,
                  },
                ]
              : [],
        ),
      );
    });
  }

  function getConfirmedPlacements(scope: PlacementScope) {
    return getRecords(scope)
      .filter((record) => record.status === "confirmed")
      .map((record) => record.prepared);
  }

  async function mergeRows(
    scope: PlacementScope,
    apiOrders: readonly StopLossOrder[],
  ): Promise<PlacementRow[]> {
    const indexed = apiOrders.filter(
      (order) => order.chainId === scope.chainId,
    );
    const key = (chainId: number, owner: string, hash: string) =>
      `${chainId}:${owner.toLowerCase()}:${hash.toLowerCase()}`;
    const indexedKeys = new Set(
      indexed.map((order) => key(order.chainId, order.owner, order.hash)),
    );
    if (locks)
      await locked(() => {
        const records = read();
        const remaining = records.filter(
          (record) =>
            !(
              record.status === "confirmed" &&
              record.prepared.chainId === scope.chainId &&
              record.prepared.account.toLowerCase() ===
                scope.account.toLowerCase() &&
              indexedKeys.has(
                key(
                  record.prepared.chainId,
                  record.prepared.owner,
                  record.prepared.paramsHash,
                ),
              )
            ),
        );
        if (remaining.length !== records.length) save(remaining);
      });
    const local: PlacementRow[] = getRecords(scope)
      .filter(
        (record) =>
          record.status !== "failed" &&
          record.status !== "rejected" &&
          (record.status === "confirmed" ||
            Boolean(record.transactions.setup)) &&
          !indexedKeys.has(
            key(
              record.prepared.chainId,
              record.prepared.owner,
              record.prepared.paramsHash,
            ),
          ),
      )
      .map((record) => {
        const order = decodeStopLossStaticInput(record.prepared.staticInput);
        const { prepared } = record;
        return {
          id: record.id,
          parentId: record.id,
          chainId: prepared.chainId,
          owner: prepared.owner,
          hash: prepared.paramsHash,
          status:
            record.status === "confirmed"
              ? OrderStatus.OPEN
              : OrderStatus.CREATING,
          receiver: order.receiver,
          sellAmount: order.sellAmount,
          buyAmount: order.buyAmount,
          validTo: order.validTo,
          sellToken: prepared.draft.tokenSell,
          buyToken: prepared.draft.tokenBuy,
          strike: order.strike,
          limitPrice: prepared.draft.limitPrice,
          partiallyFillable: order.isPartiallyFillable,
          isSellOrder: order.isSellOrder,
          sellTokenPriceOracle: order.sellTokenPriceOracle,
          buyTokenPriceOracle: order.buyTokenPriceOracle,
          maxTimeSinceLastOracleUpdate: order.maxTimeSinceLastOracleUpdate,
          executedSellAmount: null,
          executedBuyAmount: null,
          executedFee: null,
          createdAt:
            record.confirmedAt === undefined
              ? undefined
              : record.confirmedAt / 1000,
          transactionHash: record.transactions.setup?.transactionHash,
          source: "local",
          canLink: false,
          placement: record,
          error:
            record.status === "confirmed" &&
            record.confirmedAt !== undefined &&
            now() - record.confirmedAt >= 300000
              ? "API error: confirmed order not found."
              : record.error,
        };
      });
    const rows = new Map<string, PlacementRow>();
    for (const row of [
      ...indexed.map(
        (order): PlacementRow => ({ ...order, source: "api", canLink: true }),
      ),
      ...local,
    ]) {
      const identity = key(row.chainId, row.owner, row.hash);
      if (!rows.has(identity)) rows.set(identity, row);
    }
    return [...rows.values()];
  }

  function subscribe(listener: () => void) {
    read();
    const unsubscribe = state.subscribe(listener);
    const onStorage = (event: Event) => {
      const change = event as StorageEvent;
      if (change.key === storageName || change.key === null) {
        try {
          read();
        } catch {
          listener();
        }
      }
    };
    events?.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      events?.removeEventListener("storage", onStorage);
    };
  }

  return {
    getRecords,
    getConfirmedPlacements,
    submit,
    resume,
    abandon,
    mergeRows,
    subscribe,
  };
}
