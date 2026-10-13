import type { Address, Hex } from "viem";
import { InsufficientFundsError } from "viem";
import { createJSONStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { PreparedPlacement } from "./pollerStopLoss";
import type { ChainId } from "./publicClients";
import { decodeStopLossStaticInput } from "./staticInputDecoder";
import type { StopLossOrder } from "./stopLossOrders";
import { OrderStatus } from "./types";

export type PlacementScope = { account: Address; chainId: ChainId };
export type PlacementStage = "approval-reset" | "approval" | "setup";
export type TransactionReference = {
  id: string;
  transactionHash?: Hex;
  blockNumber?: bigint;
};
export type PlacementRecord = {
  id: string;
  revision: number;
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
  send(record: PlacementRecord): Promise<TransactionReference>;
};
export type PlacementReader = {
  readTransaction?(
    record: PlacementRecord,
    reference: TransactionReference,
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
        source: "local";
        canLink: false;
        placement: PlacementRecord;
        error?: string;
      }
  );

function isRejected(error: unknown): boolean {
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

function isDefiniteFailure(error: unknown): boolean {
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
    prepared = structuredClone(prepared);
    const record = await locked(() => {
      const active = getRecords(prepared).find(
        (entry) =>
          entry.status !== "failed" &&
          entry.status !== "rejected" &&
          entry.status !== "confirmed",
      );
      if (active) {
        if (
          active.status !== "ready" ||
          active.prepared.paramsHash.toLowerCase() !==
            prepared.paramsHash.toLowerCase()
        ) {
          throw new Error(
            "A placement is already active for this wallet and chain",
          );
        }
        if (active.stage === "approval-reset" && stage !== "approval")
          throw new Error("Approval is required after a reset");
        const next: PlacementRecord = {
          ...active,
          revision: active.revision + 1,
          stage,
          status: "prompting",
          error: undefined,
          approvalAmount:
            stage === "approval"
              ? adapter.approvalAmount
              : active.approvalAmount,
        };
        save(read().map((entry) => (entry.id === active.id ? next : entry)));
        return next;
      }
      const entry: PlacementRecord = {
        id: crypto.randomUUID(),
        revision: 0,
        prepared,
        stage,
        status: "prompting",
        approvalAmount:
          stage === "approval" ? adapter.approvalAmount : undefined,
        transactions: {},
      };
      save([...read(), entry]);
      return entry;
    });
    let reference: TransactionReference;
    try {
      reference = await adapter.send(structuredClone(record));
    } catch (error) {
      const rejected = isRejected(error);
      await locked(() =>
        save(
          read().map((entry) =>
            entry.id === record.id && entry.revision === record.revision
              ? {
                  ...entry,
                  revision: entry.revision + 1,
                  status: rejected
                    ? "rejected"
                    : isDefiniteFailure(error)
                      ? "failed"
                      : entry.status,
                  error: error instanceof Error ? error.message : String(error),
                }
              : entry,
          ),
        ),
      );
      throw error;
    }
    const pending: PlacementRecord = {
      ...record,
      revision: record.revision + 1,
      status: "pending",
      transactions: { ...record.transactions, [stage]: reference },
    };
    await locked(() =>
      save(
        read().map((entry) =>
          entry.id === record.id && entry.revision === record.revision
            ? pending
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
      try {
        if (reference && adapter.readTransaction) {
          const receipt = await adapter.readTransaction(record, reference);
          reference = receipt.reference ?? reference;
          if (receipt.status === "failed") {
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
        const confirmed = await adapter.checkState(record);
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
                      : entry.status,
                    confirmedAt:
                      confirmed && record.stage === "setup" ? now() : undefined,
                    transactions: {
                      ...entry.transactions,
                      [record.stage]: reference,
                    },
                    error: undefined,
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
    mergeRows,
    subscribe,
  };
}
