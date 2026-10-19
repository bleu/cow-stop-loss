import type { Hex } from "viem";

import type { PreparedSafePlacement, SafeCall } from "./safeStopLoss";
import type { SafeSubmission } from "./safeTransactions";
import { decodeStopLossStaticInput } from "./staticInputDecoder";
import type { StopLossOrder } from "./stopLossOrders";
import {
  isDefiniteFailure,
  isRejected,
  type PlacementOptions,
  type PlacementRow,
  type PlacementScope,
} from "./stopLossPlacement";
import { OrderStatus } from "./types";

export type SafeTransactionReference = {
  id: Hex;
  kind: "proposal" | "transaction" | "unknown";
  nonce?: bigint;
  transactionHash?: Hex;
};

export type SafePlacementRecord = {
  id: string;
  prepared: PreparedSafePlacement;
  status: "pending" | "ready" | "confirmed" | "failed" | "cancelled" | "paused";
  createdAt: number;
  error?: string;
  steps: {
    calls: SafeCall[];
    reference: SafeTransactionReference;
    status: "pending" | "success" | "failed" | "cancelled";
  }[];
};

export type SafeTransactionObservation = {
  status: "pending" | "success" | "failed" | "cancelled";
  reference?: SafeTransactionReference;
  error?: string;
};

export type SafePlacementReader = {
  readTransaction(
    prepared: PreparedSafePlacement,
    reference: SafeTransactionReference,
  ): Promise<SafeTransactionObservation>;
  isCreated(prepared: PreparedSafePlacement): Promise<boolean>;
};

const storageName = "safe-stop-loss-placement";

export function createSafeStopLossPlacement({
  storage = localStorage,
  locks = typeof navigator === "undefined" ? undefined : navigator.locks,
  now = Date.now,
  events = typeof window === "undefined" ? undefined : window,
}: PlacementOptions = {}) {
  const listeners = new Set<() => void>();

  function read(): SafePlacementRecord[] {
    const raw = storage.getItem(storageName);
    if (!raw) return [];
    const saved = JSON.parse(raw, (_key, value) =>
      value && typeof value === "object" && typeof value.__bigint === "string"
        ? BigInt(value.__bigint)
        : value,
    ) as { version: number; records: SafePlacementRecord[] };
    if (saved.version !== 1)
      throw new Error("Unsupported Safe placement storage version");
    return saved.records;
  }

  function save(records: SafePlacementRecord[]) {
    storage.setItem(
      storageName,
      JSON.stringify({ version: 1, records }, (_key, value) =>
        typeof value === "bigint" ? { __bigint: value.toString() } : value,
      ),
    );
    for (const listener of listeners) listener();
  }

  function getRecords(scope: PlacementScope) {
    return read().filter(
      (record) =>
        record.prepared.chainId === scope.chainId &&
        record.prepared.account.toLowerCase() === scope.account.toLowerCase(),
    );
  }

  async function submit(
    prepared: PreparedSafePlacement,
    submission:
      | { send: () => Promise<SafeSubmission> }
      | { calls: SafeCall[]; send: () => Promise<SafeTransactionReference> },
  ) {
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Submission is unavailable.",
      );
    return locks.request(storageName, async () => {
      const existing = getRecords(prepared).find(
        (record) =>
          record.prepared.paramsHash.toLowerCase() ===
          prepared.paramsHash.toLowerCase(),
      );
      if (existing?.status === "pending")
        throw new Error("This order is already awaiting signatures");
      if (existing && existing.status !== "ready")
        throw new Error("Only a ready order can continue placement");
      if (
        (existing?.prepared ?? prepared).draft.validTo <=
        Math.floor(now() / 1000)
      )
        throw new Error("Order has expired");
      let accepted: SafeSubmission;
      try {
        const result = await submission.send();
        accepted =
          "reference" in result
            ? result
            : {
                calls: "calls" in submission ? submission.calls : [],
                reference: result,
              };
        if (!/^0x[0-9a-fA-F]{64}$/.test(accepted.reference.id))
          throw new Error("Safe did not return a valid transaction identifier");
      } catch (cause) {
        if (existing) {
          existing.status =
            isDefiniteFailure(cause) || isRejected(cause) ? "ready" : "paused";
          existing.error =
            cause instanceof Error ? cause.message : String(cause);
          save([
            ...read().filter((entry) => entry.id !== existing.id),
            existing,
          ]);
        }
        throw cause;
      }
      const { calls, reference } = accepted;
      const record: SafePlacementRecord = {
        id: `${prepared.chainId}:${prepared.account.toLowerCase()}:${prepared.paramsHash.toLowerCase()}`,
        prepared: structuredClone(existing?.prepared ?? prepared),
        status: "pending",
        createdAt: existing?.createdAt ?? now(),
        steps: [
          ...(existing?.steps ?? []),
          { calls: structuredClone(calls), reference, status: "pending" },
        ],
      };
      save([...read().filter((entry) => entry.id !== record.id), record]);
      return record;
    });
  }

  async function refresh(scope: PlacementScope, reader: SafePlacementReader) {
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Tracking is unavailable.",
      );
    return locks.request(storageName, async () => {
      const records = read();
      for (const record of records) {
        if (
          record.prepared.chainId !== scope.chainId ||
          record.prepared.account.toLowerCase() !==
            scope.account.toLowerCase() ||
          record.status !== "pending"
        )
          continue;
        const step = record.steps[record.steps.length - 1];
        const observation = await reader.readTransaction(
          record.prepared,
          step.reference,
        );
        if (observation.reference) step.reference = observation.reference;
        if (
          observation.status === "failed" ||
          observation.status === "cancelled"
        ) {
          step.status = observation.status;
          record.status = observation.status;
          record.error = observation.error;
        }
        if (observation.status === "success") {
          const created = await reader.isCreated(record.prepared);
          step.status = "success";
          const submittedCreate = step.calls.some(
            (call) => call.stage === "create",
          );
          record.status = created
            ? "confirmed"
            : submittedCreate
              ? "failed"
              : "ready";
          record.error =
            !created && submittedCreate
              ? "Safe execution completed without order authorization"
              : undefined;
        }
      }
      save(records);
      return getRecords(scope);
    });
  }

  async function reconcile(
    scope: PlacementScope,
    indexed: readonly StopLossOrder[],
  ) {
    const matches = (record: SafePlacementRecord) => {
      const prepared = record.prepared;
      return (
        prepared.chainId === scope.chainId &&
        prepared.account.toLowerCase() === scope.account.toLowerCase() &&
        record.status !== "confirmed" &&
        indexed.some(
          (order) =>
            order.chainId === prepared.chainId &&
            order.owner.toLowerCase() === prepared.owner.toLowerCase() &&
            order.hash.toLowerCase() === prepared.paramsHash.toLowerCase(),
        )
      );
    };
    const scoped = getRecords(scope);
    if (!scoped.some(matches)) return scoped;
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Tracking is unavailable.",
      );
    return locks.request(storageName, () => {
      const records = read();
      let changed = false;
      for (const record of records) {
        if (!matches(record)) continue;
        record.status = "confirmed";
        record.error = undefined;
        changed = true;
      }
      if (changed) save(records);
      return getRecords(scope);
    });
  }

  function mergeRows(
    scope: PlacementScope,
    indexed: PlacementRow[],
  ): PlacementRow[] {
    const local = getRecords(scope).map((record): PlacementRow => {
      const prepared = record.prepared;
      const terms = decodeStopLossStaticInput(prepared.staticInput);
      const status =
        terms.validTo <= Math.floor(now() / 1000)
          ? OrderStatus.EXPIRED
          : record.status === "cancelled"
            ? OrderStatus.CANCELLED
            : record.status === "failed"
              ? OrderStatus.FAILED
              : record.status === "confirmed"
                ? OrderStatus.OPEN
                : OrderStatus.ON_QUEUE;
      return {
        ...terms,
        id: record.id,
        parentId: record.id,
        chainId: prepared.chainId,
        owner: prepared.owner,
        status,
        sellToken: prepared.draft.tokenSell,
        buyToken: prepared.draft.tokenBuy,
        partiallyFillable: terms.isPartiallyFillable,
        hash: prepared.paramsHash,
        createdAt: Math.floor(record.createdAt / 1000),
        executedSellAmount: null,
        executedBuyAmount: null,
        executedFee: null,
        source: "safe",
        canLink: false,
        safePlacement: record,
        error: record.error,
      };
    });
    return [
      ...indexed,
      ...local.filter(
        (row) =>
          !indexed.some(
            (order) =>
              order.chainId === row.chainId &&
              order.owner.toLowerCase() === row.owner.toLowerCase() &&
              order.hash.toLowerCase() === row.hash.toLowerCase(),
          ),
      ),
    ];
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: Event) => {
      const { key } = event as StorageEvent;
      if (key === storageName || key === null) listener();
    };
    events?.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      events?.removeEventListener("storage", onStorage);
    };
  }

  return { submit, getRecords, refresh, reconcile, mergeRows, subscribe };
}
