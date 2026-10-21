import type { Address, Hex } from "viem";
import { InsufficientFundsError } from "viem";
import { createJSONStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { STOP_LOSS_ADDRESS } from "./contracts";
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
  uncertain?: boolean;
  confirmedAt?: number;
  approvalAmount?: bigint;
  settlementAmount?: bigint;
  error?: string;
  transactions: Partial<Record<PlacementStage, TransactionReference>>;
};
export type PendingPlacementTransaction = PlacementScope & {
  id: string;
  revision: number;
  stage: PlacementStage;
  status: "pending";
  setup?: { owner: Address; paramsHash: Hex };
  token: Address;
  poller: Address;
  approvalAmount?: bigint;
  error?: string;
  uncertain?: boolean;
  transactions: Partial<Record<PlacementStage, TransactionReference>>;
};
type TrackedPlacement = PlacementRecord | PendingPlacementTransaction;

function scopeOf(record: TrackedPlacement): PlacementScope {
  return "prepared" in record ? record.prepared : record;
}

function pending(record: TrackedPlacement) {
  return record.status === "pending" || record.status === "prompting";
}

function persisted(record: TrackedPlacement): TrackedPlacement | undefined {
  if (!("prepared" in record)) return record;
  if (
    record.status === "confirmed" ||
    (record.stage === "setup" &&
      record.status !== "prompting" &&
      record.transactions.setup)
  )
    return record;
  if (
    !pending(record) ||
    (record.status === "prompting" && !record.uncertain) ||
    (!record.transactions[record.stage] && !record.uncertain)
  )
    return undefined;
  return {
    account: record.prepared.account,
    chainId: record.prepared.chainId,
    id: record.id,
    revision: record.revision,
    stage: record.stage,
    status: "pending",
    setup:
      record.stage === "setup"
        ? {
            owner: record.prepared.owner,
            paramsHash: record.prepared.paramsHash,
          }
        : undefined,
    token: record.prepared.draft.tokenSell.address,
    poller: record.prepared.poller,
    approvalAmount: record.approvalAmount,
    error: record.error,
    uncertain: record.uncertain,
    transactions: record.transactions[record.stage]
      ? { [record.stage]: record.transactions[record.stage] }
      : {},
  };
}

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
    record: TrackedPlacement,
    reference: TransactionReference,
    saveReference?: (reference: TransactionReference) => Promise<void>,
  ): Promise<{
    status: "pending" | "success" | "failed";
    error?: string;
    reference?: TransactionReference;
  }>;
  checkState(record: TrackedPlacement): Promise<boolean>;
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
    async () => {
      if (flow === "repair") await createStopLossPlacement(options).cleanup();
      const otherKey =
        flow === "placement" ? "stop-loss-approval-repair" : storageName;
      const raw = options.storage.getItem(otherKey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          version: number;
          state: {
            records: {
              prepared?: PlacementScope;
              account?: Address;
              chainId?: ChainId;
              status: PlacementRecord["status"];
            }[];
            pendingTransactions?: PendingPlacementTransaction[];
          };
        };
        if (saved.version !== 1 && (flow !== "repair" || saved.version !== 2))
          throw new Error("Unsupported stop-loss submission storage version");
        if (
          [
            ...saved.state.records,
            ...(saved.state.pendingTransactions ?? []),
          ].some((record) => {
            const identity = "prepared" in record ? record.prepared! : record;
            return (
              identity.chainId === scope.chainId &&
              identity.account?.toLowerCase() === scope.account.toLowerCase() &&
              (record.status === "pending" || record.status === "prompting")
            );
          })
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
  const jsonStorage = createJSONStorage<{
    records: PlacementRecord[];
    pendingTransactions?: PendingPlacementTransaction[];
  }>(() => storage, {
    replacer: (_key, value) =>
      typeof value === "bigint" ? { __bigint: value.toString() } : value,
    reviver: (_key, value) =>
      value &&
      typeof value === "object" &&
      "__bigint" in value &&
      typeof value.__bigint === "string"
        ? BigInt(value.__bigint)
        : value,
  })!;
  const state = createStore(() => ({ records: [] as TrackedPlacement[] }));
  let snapshot: string | null | undefined;
  let needsCleanup = false;

  function read() {
    const raw = storage.getItem(storageName);
    if (snapshot === raw) return state.getState().records;
    const saved = jsonStorage.getItem(storageName);
    if (saved instanceof Promise)
      throw new Error("Placement storage must be synchronous");
    if (saved && saved.version !== 1 && saved.version !== 2)
      throw new Error("Unsupported placement storage version");
    const previous = raw === null ? [] : state.getState().records;
    const records = [
      ...(saved?.state.records ?? []),
      ...(saved?.state.pendingTransactions ?? []),
    ].flatMap((record) => {
      // Old approval drafts and unsigned setup prompts are not recoverable orders.
      if (
        "prepared" in record &&
        record.status === "prompting" &&
        !record.uncertain
      )
        return [];
      const stored = persisted(record);
      return stored ? [stored] : [];
    });
    const normalized = {
      state: {
        records: records.filter(
          (record): record is PlacementRecord => "prepared" in record,
        ),
        pendingTransactions: records.filter(
          (record): record is PendingPlacementTransaction =>
            !("prepared" in record),
        ),
      },
      version: 2,
    };
    needsCleanup = Boolean(
      saved &&
        JSON.stringify(saved, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ) !==
          JSON.stringify(normalized, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
    );
    snapshot = raw;
    const merged = records.map((record) => {
      const live = previous.find(
        (entry): entry is PlacementRecord =>
          entry.id === record.id && "prepared" in entry,
      );
      return live && !("prepared" in record)
        ? { ...live, ...record, prepared: live.prepared }
        : record;
    });
    for (const record of previous) {
      if (
        "prepared" in record &&
        !persisted(record) &&
        !merged.some((entry) => entry.id === record.id)
      )
        merged.push(record);
    }
    state.setState({ records: merged });
    return state.getState().records;
  }

  function save(records: TrackedPlacement[]) {
    const saved = records.flatMap((record) => {
      const value = persisted(record);
      return value ? [value] : [];
    });
    jsonStorage.setItem(storageName, {
      state: {
        records: saved.filter(
          (record): record is PlacementRecord => "prepared" in record,
        ),
        pendingTransactions: saved.filter(
          (record): record is PendingPlacementTransaction =>
            !("prepared" in record),
        ),
      },
      version: 2,
    });
    snapshot = storage.getItem(storageName);
    needsCleanup = false;
    state.setState({ records });
  }

  function scoped(scope: PlacementScope) {
    return read().filter((record) => {
      const identity = scopeOf(record);
      return (
        identity.chainId === scope.chainId &&
        identity.account.toLowerCase() === scope.account.toLowerCase()
      );
    });
  }

  function getRecords(scope: PlacementScope): PlacementRecord[] {
    return structuredClone(
      scoped(scope).filter(
        (record): record is PlacementRecord => "prepared" in record,
      ),
    );
  }

  function getPendingTransactions(
    scope: PlacementScope,
  ): PendingPlacementTransaction[] {
    return structuredClone(
      scoped(scope).filter(
        (record): record is PendingPlacementTransaction =>
          !("prepared" in record),
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

  async function cleanup() {
    if (!locks) return;
    await locked(() => {
      const records = read();
      if (needsCleanup) save(records);
    });
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
    await cleanup();
    return withStopLossSubmission(
      prepared,
      "placement",
      { storage, locks },
      async () => {
        const record = await locked(() => {
          const active =
            scoped(prepared).find(pending) ??
            getRecords(prepared).find(
              (entry) =>
                ["ready", "failed", "rejected"].includes(entry.status) &&
                entry.prepared.paramsHash.toLowerCase() ===
                  prepared.paramsHash.toLowerCase(),
            );
          if (active) {
            if (!("prepared" in active))
              throw new Error(
                "A placement is already active for this wallet and chain",
              );
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
              uncertain: undefined,
              transactions: { ...active.transactions, [stage]: undefined },
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
        });
        const isCurrentAttempt = (entry: TrackedPlacement) =>
          "prepared" in entry &&
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
                if (rejected || isDefiniteFailure(error)) return [];
                return [
                  {
                    ...entry,
                    revision: entry.revision + 1,
                    uncertain: true,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                ];
              }),
            ),
          );
          throw error;
        }
        await locked(() =>
          save(
            read().map<TrackedPlacement>((entry) =>
              "prepared" in entry && isCurrentAttempt(entry)
                ? {
                    ...entry,
                    revision: entry.revision + 1,
                    status:
                      entry.status === "prompting" ? "pending" : entry.status,
                    transactions: { ...entry.transactions, [stage]: reference },
                  }
                : entry,
            ),
          ),
        );
        return getRecords(prepared).find((entry) => entry.id === record.id);
      },
    );
  }

  async function resume(scope: PlacementScope, adapter: PlacementReader) {
    await cleanup();
    for (const record of structuredClone(scoped(scope))) {
      if (
        !pending(record) ||
        (record.status === "prompting" && !record.uncertain)
      )
        continue;
      let reference = record.transactions[record.stage];
      const update = (
        change: (entry: TrackedPlacement) => TrackedPlacement | undefined,
      ) =>
        locked(() =>
          save(
            read().flatMap((entry) => {
              if (entry.id !== record.id || entry.revision !== record.revision)
                return [entry];
              const next = change(entry);
              return next ? [next] : [];
            }),
          ),
        );
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
              await update((entry) => ({
                ...entry,
                transactions: { ...entry.transactions, [record.stage]: next },
              }));
            },
          );
          transactionSucceeded = receipt.status === "success";
          reference = receipt.reference ?? reference;
          if (receipt.status === "pending" && receipt.error)
            throw new Error(receipt.error);
          if (
            receipt.status === "failed" &&
            record.stage === "setup" &&
            "prepared" in record
          )
            created = await adapter.checkState(record);
          if (receipt.status === "failed" && !created) {
            await update((entry) =>
              "prepared" in entry
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
                : undefined,
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
        await update((entry) => {
          if (!("prepared" in entry)) {
            if (confirmed || allowanceChanged) return undefined;
            return {
              ...entry,
              revision: entry.revision + 1,
              transactions: {
                ...entry.transactions,
                [record.stage]: reference,
              },
            };
          }
          return {
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
            transactions: { ...entry.transactions, [record.stage]: reference },
            error: allowanceChanged
              ? "Approval completed, but allowance changed. Review the order again."
              : !confirmed && entry.status === "prompting"
                ? entry.error
                : undefined,
          };
        });
      } catch (error) {
        await update((entry) => ({
          ...entry,
          revision: entry.revision + 1,
          error: error instanceof Error ? error.message : String(error),
          transactions: { ...entry.transactions, [record.stage]: reference },
        }));
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
              "prepared" in record &&
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
        if (remaining.length !== records.length || needsCleanup)
          save(remaining);
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
          funding: {
            kind: "scheduled",
            funder: prepared.account,
            handler: STOP_LOSS_ADDRESS,
            salt: prepared.draft.salt,
            staticInput: prepared.staticInput,
          },
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
    getPendingTransactions,
    cleanup,
    mergeRows,
    subscribe,
  };
}
