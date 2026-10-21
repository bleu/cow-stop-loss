import { createJSONStorage } from "zustand/middleware";

import { ApprovalRepairWork, PreparedApprovalRepair } from "./pollerStopLoss";
import {
  isDefiniteFailure,
  isRejected,
  PlacementOptions,
  PlacementScope,
  TransactionReference,
  withStopLossSubmission,
} from "./stopLossPlacement";

export type ApprovalRepairRecord = {
  id: string;
  revision: number;
  prepared: PreparedApprovalRepair;
  work: ApprovalRepairWork;
  status: "prompting" | "pending" | "failed" | "rejected" | "confirmed";
  reference?: TransactionReference;
  error?: string;
};
export type ApprovalRepairReader = {
  readTransaction(
    reference: TransactionReference,
    saveReference?: (reference: TransactionReference) => Promise<void>,
  ): Promise<{
    status: "pending" | "success" | "failed";
    reference?: TransactionReference;
    error?: string;
  }>;
  checkPermission(record: ApprovalRepairRecord): Promise<boolean>;
};
const storageName = "stop-loss-approval-repair";

export function createStopLossApprovalRepair({
  storage = localStorage,
  locks = typeof navigator === "undefined" ? undefined : navigator.locks,
  events = typeof window === "undefined" ? undefined : window,
}: PlacementOptions = {}) {
  const json = createJSONStorage<{ records: ApprovalRepairRecord[] }>(
    () => storage,
    {
      replacer: (_key, value) =>
        typeof value === "bigint" ? { __bigint: value.toString() } : value,
      reviver: (_key, value) =>
        value && typeof value === "object" && "__bigint" in value
          ? BigInt(value.__bigint as string)
          : value,
    },
  )!;
  const listeners = new Set<() => void>();
  function read() {
    const saved = json.getItem(storageName);
    if (saved instanceof Promise)
      throw new Error("Approval storage must be synchronous");
    if (saved && saved.version !== 1)
      throw new Error("Unsupported approval storage version");
    return saved?.state.records ?? [];
  }
  function save(records: ApprovalRepairRecord[]) {
    json.setItem(storageName, { state: { records }, version: 1 });
    listeners.forEach((listener) => listener());
  }
  function getRecords(scope: PlacementScope) {
    return structuredClone(
      read().filter(
        ({ prepared }) =>
          prepared.chainId === scope.chainId &&
          prepared.account.toLowerCase() === scope.account.toLowerCase(),
      ),
    );
  }
  function locked<T>(action: () => T | Promise<T>) {
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Approval updates are unavailable.",
      );
    return locks.request(storageName, action);
  }
  async function submit(
    prepared: PreparedApprovalRepair,
    work: ApprovalRepairWork,
    send: () => Promise<TransactionReference>,
  ) {
    const record = await withStopLossSubmission(
      prepared,
      "repair",
      { storage, locks },
      () =>
        locked(() => {
          if (
            getRecords(prepared).some(
              ({ status }) => status === "prompting" || status === "pending",
            )
          )
            throw new Error(
              "An approval update is already pending for this wallet and chain",
            );
          const next: ApprovalRepairRecord = {
            id: crypto.randomUUID(),
            revision: 0,
            prepared: structuredClone(prepared),
            work: structuredClone(work),
            status: "prompting",
          };
          save([
            ...read().filter(
              ({ prepared: old }) =>
                !(
                  old.chainId === prepared.chainId &&
                  old.account.toLowerCase() ===
                    prepared.account.toLowerCase() &&
                  old.paramsHash.toLowerCase() ===
                    prepared.paramsHash.toLowerCase()
                ),
            ),
            next,
          ]);
          return next;
        }),
    );
    try {
      const reference = await send();
      await locked(() =>
        save(
          read().map((entry) =>
            entry.id === record.id
              ? {
                  ...entry,
                  revision: entry.revision + 1,
                  status: "pending",
                  reference,
                }
              : entry,
          ),
        ),
      );
    } catch (cause) {
      await locked(() =>
        save(
          read().map((entry) =>
            entry.id === record.id
              ? {
                  ...entry,
                  revision: entry.revision + 1,
                  status: isRejected(cause)
                    ? "rejected"
                    : isDefiniteFailure(cause)
                      ? "failed"
                      : entry.status,
                  error: cause instanceof Error ? cause.message : String(cause),
                }
              : entry,
          ),
        ),
      );
      throw cause;
    }
    return getRecords(prepared).find(({ id }) => id === record.id)!;
  }
  async function resume(scope: PlacementScope, reader: ApprovalRepairReader) {
    for (const record of getRecords(scope)) {
      if (record.status !== "pending" || !record.reference) continue;
      let reference = record.reference;
      try {
        const receipt = await reader.readTransaction(
          reference,
          async (next) => {
            await locked(() =>
              save(
                read().map((entry) =>
                  entry.id === record.id && entry.revision === record.revision
                    ? { ...entry, reference: next }
                    : entry,
                ),
              ),
            );
          },
        );
        reference = receipt.reference ?? reference;
        const confirmed =
          receipt.status === "success" &&
          (await reader.checkPermission({ ...record, reference }));
        await locked(() =>
          save(
            read().map((entry) =>
              entry.id === record.id && entry.revision === record.revision
                ? {
                    ...entry,
                    revision: entry.revision + 1,
                    reference,
                    status: confirmed
                      ? "confirmed"
                      : receipt.status === "pending"
                        ? "pending"
                        : "failed",
                    error:
                      confirmed || receipt.status === "pending"
                        ? undefined
                        : (receipt.error ??
                          "Transaction completed without the required allowance"),
                  }
                : entry,
            ),
          ),
        );
      } catch (cause) {
        await locked(() =>
          save(
            read().map((entry) =>
              entry.id === record.id && entry.revision === record.revision
                ? {
                    ...entry,
                    revision: entry.revision + 1,
                    reference,
                    error:
                      cause instanceof Error ? cause.message : String(cause),
                  }
                : entry,
            ),
          ),
        );
      }
    }
    return getRecords(scope);
  }
  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: Event) => {
      const key = (event as StorageEvent).key;
      if (key === null || key === storageName) listener();
    };
    events?.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      events?.removeEventListener("storage", onStorage);
    };
  }
  return { getRecords, submit, resume, subscribe };
}
