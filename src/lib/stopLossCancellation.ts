import {
  type Address,
  encodeFunctionData,
  isHex,
  type PublicClient,
} from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { composableCowPollerAbi } from "./abis/composableCowPoller";
import { cowShedAbi, cowShedFactoryAbi } from "./abis/cowShedFactory";
import { readAccountExecution } from "./accountExecution";
import {
  COMPOSABLE_COW_ADDRESS,
  POLLER_ADDRESS_BY_CHAIN_ID,
} from "./contracts";
import { publicClientsFromIds } from "./publicClients";
import { readSafeTransaction } from "./safeApi";
import type { StopLossOrder } from "./stopLossOrders";
import { OrderStatus } from "./types";

export async function buildCancellation({
  account,
  order,
  client = publicClientsFromIds[order.chainId],
}: {
  account: Address;
  order: StopLossOrder;
  client?: PublicClient;
}) {
  const hash = order.hash;
  if (!isHex(hash) || hash.length !== 66)
    throw new Error("Invalid conditional-order hash.");
  if (
    !order.isSellOrder ||
    ![OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED].includes(order.status)
  )
    throw new Error("Only open exact-sell orders can be cancelled.");
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  const execution =
    account.toLowerCase() === order.owner.toLowerCase()
      ? await readAccountExecution(
          { account, chainId: order.chainId },
          { client },
        )
      : undefined;
  if (execution?.kind === "unsupported")
    throw new Error(
      execution.error ?? "This contract account is not a supported Safe.",
    );
  if (execution?.kind === "safe") {
    const active = await client.readContract({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "singleOrders",
      args: [order.owner, hash],
      blockNumber,
    });
    if (!active) throw new Error("This order is no longer active.");
    return {
      execution: "safe" as const,
      account,
      order: { ...order },
      hash,
      blockNumber,
      transaction: {
        account,
        chainId: order.chainId,
        to: COMPOSABLE_COW_ADDRESS,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: composableCowAbi,
          functionName: "remove",
          args: [hash],
        }),
      },
    };
  }
  const factory = await client.readContract({
    address: POLLER_ADDRESS_BY_CHAIN_ID[order.chainId],
    abi: composableCowPollerAbi,
    functionName: "COW_SHED_FACTORY",
    blockNumber,
  });
  const proxy = await client.readContract({
    address: factory,
    abi: cowShedFactoryAbi,
    functionName: "proxyOf",
    args: [account],
    blockNumber,
  });
  if (proxy.toLowerCase() !== order.owner.toLowerCase())
    throw new Error("This wallet cannot cancel this order.");
  const trustedExecutor = await client.readContract({
    address: order.owner,
    abi: cowShedAbi,
    functionName: "trustedExecutor",
    blockNumber,
  });
  if (trustedExecutor.toLowerCase() !== factory.toLowerCase())
    throw new Error("CowShed does not trust the Poller-pinned factory.");
  const active = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "singleOrders",
    args: [order.owner, hash],
    blockNumber,
  });
  if (!active) throw new Error("This order is no longer active.");
  return {
    execution: "eoa" as const,
    account,
    order: { ...order },
    hash,
    blockNumber,
    transaction: {
      account,
      chainId: order.chainId,
      to: factory,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: cowShedFactoryAbi,
        functionName: "executeOwnHooks",
        args: [
          [
            {
              target: COMPOSABLE_COW_ADDRESS,
              value: BigInt(0),
              allowFailure: false,
              isDelegateCall: false,
              callData: encodeFunctionData({
                abi: composableCowAbi,
                functionName: "remove",
                args: [hash],
              }),
            },
          ],
        ],
      }),
    },
  };
}
export type PreparedCancellation = Awaited<
  ReturnType<typeof buildCancellation>
>;

export class CancellationRevertedError extends Error {
  constructor() {
    super("Cancellation transaction reverted.");
  }
}

export async function observeCancellation(
  prepared: PreparedCancellation,
  reference: `0x${string}` | undefined,
  {
    client = publicClientsFromIds[prepared.order.chainId],
  }: { client?: PublicClient } = {},
): Promise<boolean> {
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  if (blockNumber <= prepared.blockNumber) return false;
  if (prepared.execution === "safe") {
    if (!reference) return false;
    const observation = await readSafeTransaction(
      { account: prepared.account, chainId: prepared.order.chainId },
      { id: reference, kind: "proposal" },
      { client },
    );
    if (observation.status === "failed") throw new CancellationRevertedError();
    if (observation.status !== "success") return false;
  }
  const active = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "singleOrders",
    args: [prepared.order.owner, prepared.hash],
    blockNumber,
  });
  if (reference && prepared.execution !== "safe") {
    try {
      const receipt = await client.getTransactionReceipt({ hash: reference });
      if (receipt.status === "reverted") throw new CancellationRevertedError();
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== "TransactionReceiptNotFoundError"
      )
        throw error;
    }
  }
  return !active;
}
