"use client";

import { useEffect, useState } from "react";
import {
  Address,
  erc20Abi,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";

import { verifyPlacementConfirmation } from "#/lib/pollerStopLoss";
import {
  ChainId,
  publicClientsFromIds,
  supportedChainIds,
} from "#/lib/publicClients";
import {
  createStopLossPlacement,
  PlacementReader,
  PlacementRecord,
} from "#/lib/stopLossPlacement";

let controller: ReturnType<typeof createStopLossPlacement> | undefined;

export function getStopLossPlacement() {
  controller ??= createStopLossPlacement();
  return controller;
}

export function useStopLossPlacement(account?: Address, chainId?: ChainId) {
  const [records, setRecords] = useState<PlacementRecord[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!account) {
      setRecords([]);
      setError(undefined);
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    const fail = (cause: unknown) => {
      if (!stopped) {
        setRecords([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "Placement tracking is unavailable",
        );
      }
    };
    try {
      const placement = getStopLossPlacement();
      const chains = chainId ? [chainId] : supportedChainIds;
      const update = () => {
        try {
          setRecords(
            chains.flatMap((selectedChain) =>
              placement.getRecords({ account, chainId: selectedChain }),
            ),
          );
          setError(undefined);
        } catch (cause) {
          fail(cause);
        }
      };
      update();
      unsubscribe = placement.subscribe(update);
      const poll = async () => {
        try {
          for (const selectedChain of chains) {
            if (stopped) return;
            const pending = placement
              .getRecords({ account, chainId: selectedChain })
              .some(
                (record) =>
                  record.status === "pending" || record.status === "prompting",
              );
            if (pending) await resumeStopLossPlacement(account, selectedChain);
          }
        } catch (cause) {
          fail(cause);
        } finally {
          if (!stopped) timer = setTimeout(poll, 10000);
        }
      };
      void poll();
    } catch (cause) {
      fail(cause);
    }
    return () => {
      stopped = true;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [account, chainId]);
  return { records, error };
}

const resumptions = new Map<string, Promise<PlacementRecord[]>>();

export function resumeStopLossPlacement(account: Address, chainId: ChainId) {
  const key = `${account.toLowerCase()}:${chainId}`;
  const current = resumptions.get(key);
  if (current) return current;
  const task = readSavedPlacement(account, chainId).finally(() => {
    resumptions.delete(key);
  });
  resumptions.set(key, task);
  return task;
}

async function readSavedPlacement(account: Address, chainId: ChainId) {
  return getStopLossPlacement().resume(
    { account, chainId },
    placementReader(chainId),
  );
}

export async function abandonStopLossPlacement(
  account: Address,
  chainId: ChainId,
  id: string,
) {
  await resumeStopLossPlacement(account, chainId);
  return getStopLossPlacement().abandon(
    { account, chainId },
    id,
    placementReader(chainId),
  );
}

function placementReader(chainId: ChainId): PlacementReader {
  const client = publicClientsFromIds[chainId];
  return {
    async readTransaction(_record, reference) {
      if (!reference.transactionHash) return { status: "pending" };
      try {
        let replacementError: string | undefined;
        const receipt = await client.waitForTransactionReceipt({
          hash: reference.transactionHash,
          timeout: 10000,
          onReplaced: ({ reason }) => {
            if (reason === "cancelled")
              replacementError = "Transaction cancelled";
            if (reason === "replaced")
              replacementError = "Transaction replaced with a different action";
          },
        });
        return {
          status:
            receipt.status === "success" && !replacementError
              ? "success"
              : "failed",
          error:
            replacementError ??
            (receipt.status === "reverted"
              ? "Transaction reverted"
              : undefined),
          reference: {
            ...reference,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
          },
        };
      } catch (error) {
        if (
          error instanceof TransactionNotFoundError ||
          error instanceof TransactionReceiptNotFoundError ||
          error instanceof WaitForTransactionReceiptTimeoutError
        )
          return { status: "pending" };
        throw error;
      }
    },
    async checkState(record) {
      if (record.stage === "setup")
        return verifyPlacementConfirmation(record.prepared, { client });
      const allowance = await client.readContract({
        address: record.prepared.draft.tokenSell.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [record.prepared.account, record.prepared.poller],
      });
      if (record.stage === "approval-reset") return allowance === BigInt(0);
      return (
        record.approvalAmount !== undefined &&
        allowance >= record.approvalAmount
      );
    },
  };
}
