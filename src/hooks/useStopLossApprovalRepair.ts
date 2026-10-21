"use client";

import { useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";

import { GPV2_VAULT_RELAYER_ADDRESS } from "#/lib/contracts";
import { ChainId, publicClientsFromIds } from "#/lib/publicClients";
import {
  ApprovalRepairRecord,
  createStopLossApprovalRepair,
} from "#/lib/stopLossApprovalRepair";

import { readStopLossTransaction } from "./useStopLossPlacement";

let controller: ReturnType<typeof createStopLossApprovalRepair> | undefined;
export function getStopLossApprovalRepair() {
  controller ??= createStopLossApprovalRepair();
  return controller;
}
const resumptions = new Map<string, Promise<ApprovalRepairRecord[]>>();
export function resumeStopLossApprovalRepair(
  account: Address,
  chainId: ChainId,
) {
  const key = `${account.toLowerCase()}:${chainId}`;
  const running = resumptions.get(key);
  if (running) return running;
  const client = publicClientsFromIds[chainId];
  const task = getStopLossApprovalRepair()
    .resume(
      { account, chainId },
      {
        readTransaction: (reference, saveReference) =>
          readStopLossTransaction(reference, client, saveReference),
        async checkPermission({ prepared, work, reference }) {
          const allowance = await client.readContract({
            address: prepared.draft.tokenSell.address,
            abi: erc20Abi,
            functionName: "allowance",
            args:
              work.stage === "wallet"
                ? [prepared.account, prepared.poller]
                : [prepared.owner, GPV2_VAULT_RELAYER_ADDRESS],
            blockNumber: reference?.blockNumber,
          });
          return allowance >= work.target;
        },
      },
    )
    .finally(() => resumptions.delete(key));
  resumptions.set(key, task);
  return task;
}

export function useStopLossApprovalRepair(
  account?: Address,
  chainId?: ChainId,
) {
  const [records, setRecords] = useState<ApprovalRepairRecord[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!account || !chainId) {
      setRecords([]);
      setError(undefined);
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tracker = getStopLossApprovalRepair();
    const update = () => {
      if (stopped) return;
      try {
        setRecords(tracker.getRecords({ account, chainId }));
        setError(undefined);
      } catch (cause) {
        setRecords([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "Approval tracking is unavailable",
        );
      }
    };
    update();
    const unsubscribe = tracker.subscribe(update);
    const poll = async () => {
      try {
        if (
          tracker
            .getRecords({ account, chainId })
            .some(({ status }) => status === "pending")
        )
          await resumeStopLossApprovalRepair(account, chainId);
      } catch (cause) {
        if (!stopped)
          setError(
            cause instanceof Error
              ? cause.message
              : "Approval tracking is unavailable",
          );
      } finally {
        if (!stopped) timer = setTimeout(poll, 10000);
      }
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [account, chainId]);
  return {
    records: records.filter(
      ({ prepared }) =>
        prepared.account.toLowerCase() === account?.toLowerCase() &&
        prepared.chainId === chainId,
    ),
    error,
  };
}
