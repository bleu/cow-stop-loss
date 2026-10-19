import {
  type Address,
  encodeFunctionData,
  erc20Abi,
  maxUint256,
  type PublicClient,
} from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { readAccountExecution } from "./accountExecution";
import {
  COMPOSABLE_COW_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
} from "./contracts";
import { publicClientsFromIds } from "./publicClients";
import { readSafeTransaction } from "./safeApi";
import type { SafeTransactionReference } from "./safeStopLossPlacement";
import type { PreparedCancellation } from "./stopLossCancellation";
import type { StopLossOrder } from "./stopLossOrders";
import type { PlacementOptions, PlacementScope } from "./stopLossPlacement";
import { OrderStatus } from "./types";

export async function buildSafeApprovalRepair(
  { account, order }: { account: Address; order: StopLossOrder },
  {
    client = publicClientsFromIds[order.chainId],
  }: { client?: PublicClient } = {},
) {
  if (
    account.toLowerCase() !== order.owner.toLowerCase() ||
    (
      await readAccountExecution(
        { account, chainId: order.chainId },
        { client },
      )
    ).kind !== "safe"
  )
    throw new Error(
      "Approval repair requires the supported Safe that owns this order.",
    );
  if (
    !order.isSellOrder ||
    ![OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED].includes(order.status) ||
    !/^0x[0-9a-fA-F]{64}$/.test(order.hash)
  )
    throw new Error("Only active exact-sell orders support approval repair.");
  const active = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "singleOrders",
    args: [order.owner, order.hash as `0x${string}`],
  });
  if (!active) throw new Error("This order is no longer active.");
  const allowance = await client.readContract({
    address: order.sellToken.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account, GPV2_VAULT_RELAYER_ADDRESS],
  });
  if (allowance >= order.sellAmount - (order.executedSellAmount ?? BigInt(0)))
    return undefined;
  const target = allowance > BigInt(0) ? BigInt(0) : maxUint256;
  return {
    account,
    order,
    target,
    transaction: {
      account,
      chainId: order.chainId,
      to: order.sellToken.address,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [GPV2_VAULT_RELAYER_ADDRESS, target],
      }),
    },
  };
}
export type PreparedSafeApprovalRepair = NonNullable<
  Awaited<ReturnType<typeof buildSafeApprovalRepair>>
>;

export type SafeControlRecord = {
  id: string;
  account: Address;
  order: StopLossOrder;
  action: "cancel" | "approve";
  target?: bigint;
  status: "pending" | "confirmed" | "failed" | "cancelled";
  reference: SafeTransactionReference;
  createdAt: number;
};
const storageName = "safe-stop-loss-controls";

export function createSafeOrderControls({
  storage = localStorage,
  locks = typeof navigator === "undefined" ? undefined : navigator.locks,
  now = Date.now,
  events = typeof window === "undefined" ? undefined : window,
}: PlacementOptions = {}) {
  const listeners = new Set<() => void>();
  function read(): SafeControlRecord[] {
    const raw = storage.getItem(storageName);
    if (!raw) return [];
    const saved = JSON.parse(raw, (_key, value) =>
      value && typeof value === "object" && typeof value.__bigint === "string"
        ? BigInt(value.__bigint)
        : value,
    );
    if (saved.version !== 1)
      throw new Error("Unsupported Safe control storage version");
    return saved.records;
  }
  function save(records: SafeControlRecord[]) {
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
        record.order.chainId === scope.chainId &&
        record.account.toLowerCase() === scope.account.toLowerCase(),
    );
  }
  async function submitCancellation(
    prepared: PreparedCancellation,
    send: () => Promise<SafeTransactionReference>,
  ) {
    if (prepared.execution !== "safe")
      throw new Error("Safe cancellation requires a verified Safe.");
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Submission is unavailable.",
      );
    return locks.request(storageName, async () => {
      if (
        getRecords({
          account: prepared.account,
          chainId: prepared.order.chainId,
        }).some(
          (record) =>
            record.order.hash.toLowerCase() === prepared.hash.toLowerCase() &&
            record.action === "cancel" &&
            record.status === "pending",
        )
      )
        throw new Error("Cancellation is already awaiting signatures.");
      const reference = await send();
      if (!/^0x[0-9a-fA-F]{64}$/.test(reference.id))
        throw new Error("Safe did not return a valid transaction identifier");
      const record: SafeControlRecord = {
        id: `${prepared.order.chainId}:${prepared.account.toLowerCase()}:${prepared.hash.toLowerCase()}:cancel:${reference.id}`,
        account: prepared.account,
        order: prepared.order,
        action: "cancel",
        status: "pending",
        reference,
        createdAt: now(),
      };
      save([...read(), record]);
      return record;
    });
  }
  async function submitApproval(
    prepared: PreparedSafeApprovalRepair,
    send: () => Promise<SafeTransactionReference>,
  ) {
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Submission is unavailable.",
      );
    return locks.request(storageName, async () => {
      if (
        getRecords({
          account: prepared.account,
          chainId: prepared.order.chainId,
        }).some(
          (record) =>
            record.action === "approve" &&
            record.order.sellToken.address.toLowerCase() ===
              prepared.order.sellToken.address.toLowerCase() &&
            record.status === "pending",
        )
      )
        throw new Error("Approval is already awaiting signatures.");
      const reference = await send();
      if (!/^0x[0-9a-fA-F]{64}$/.test(reference.id))
        throw new Error("Safe did not return a valid transaction identifier");
      const record: SafeControlRecord = {
        id: `${prepared.order.chainId}:${prepared.account.toLowerCase()}:${prepared.order.hash.toLowerCase()}:approve:${reference.id}`,
        account: prepared.account,
        order: prepared.order,
        action: "approve",
        target: prepared.target,
        status: "pending",
        reference,
        createdAt: now(),
      };
      save([...read(), record]);
      return record;
    });
  }
  async function refresh(
    scope: PlacementScope,
    {
      client = publicClientsFromIds[scope.chainId],
    }: { client?: PublicClient } = {},
  ) {
    if (!locks)
      throw new Error(
        "This browser does not support Web Locks. Tracking is unavailable.",
      );
    return locks.request(storageName, async () => {
      const records = read();
      for (const record of records) {
        if (
          record.account.toLowerCase() !== scope.account.toLowerCase() ||
          record.order.chainId !== scope.chainId ||
          record.status !== "pending"
        )
          continue;
        const observation = await readSafeTransaction(scope, record.reference, {
          client,
        });
        if (observation.reference) record.reference = observation.reference;
        if (
          observation.status === "failed" ||
          observation.status === "cancelled"
        )
          record.status = observation.status;
        if (observation.status === "success") {
          if (record.action === "cancel") {
            const active = await client.readContract({
              address: COMPOSABLE_COW_ADDRESS,
              abi: composableCowAbi,
              functionName: "singleOrders",
              args: [record.order.owner, record.order.hash as `0x${string}`],
            });
            if (!active) record.status = "confirmed";
          } else {
            const allowance = await client.readContract({
              address: record.order.sellToken.address,
              abi: erc20Abi,
              functionName: "allowance",
              args: [record.account, GPV2_VAULT_RELAYER_ADDRESS],
            });
            if (
              record.target === BigInt(0)
                ? allowance === BigInt(0)
                : record.target !== undefined && allowance >= record.target
            )
              record.status = "confirmed";
          }
        }
      }
      save(records);
      return getRecords(scope);
    });
  }
  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: Event) => {
      if (
        (event as StorageEvent).key === storageName ||
        (event as StorageEvent).key === null
      )
        listener();
    };
    events?.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      events?.removeEventListener("storage", onStorage);
    };
  }
  return { getRecords, submitCancellation, submitApproval, refresh, subscribe };
}
