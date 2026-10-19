"use client";

import { useEffect, useMemo, useState } from "react";
import { Address, erc20Abi } from "viem";

import { GPV2_VAULT_RELAYER_ADDRESS } from "#/lib/contracts";
import {
  ChainId,
  publicClientsFromIds,
  supportedChainIds,
} from "#/lib/publicClients";
import {
  createSafeOrderControls,
  type SafeControlRecord,
} from "#/lib/safeOrderControls";
import {
  ApprovalRepairRecord,
  createStopLossApprovalRepair,
} from "#/lib/stopLossApprovalRepair";

import { readStopLossTransaction } from "./useStopLossPlacement";

let safeController: ReturnType<typeof createSafeOrderControls> | undefined;
export function getSafeOrderControls() {
  safeController ??= createSafeOrderControls();
  return safeController;
}

export function useSafeOrderControls(account?: Address, chainId?: ChainId) {
  const [records, setRecords] = useState<SafeControlRecord[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!account) {
      setRecords([]);
      setError(undefined);
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controls = getSafeOrderControls();
    const chains = chainId ? [chainId] : supportedChainIds;
    let previous: string | undefined;
    const update = () => {
      if (stopped) return;
      try {
        const next = chains.flatMap((chainId) =>
          controls.getRecords({ account, chainId }),
        );
        const revision = JSON.stringify(next, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        );
        if (revision !== previous) {
          previous = revision;
          setRecords(next);
        }
        setError(undefined);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Safe control tracking is unavailable.",
        );
      }
    };
    update();
    const unsubscribe = controls.subscribe(update);
    const poll = async () => {
      try {
        for (const chainId of chains) {
          if (
            controls
              .getRecords({ account, chainId })
              .some((record) => record.status === "pending")
          )
            await controls.refresh({ account, chainId });
        }
        update();
      } catch (cause) {
        if (!stopped)
          setError(
            cause instanceof Error
              ? cause.message
              : "Safe control tracking is unavailable.",
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
  const scopedRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.account.toLowerCase() === account?.toLowerCase() &&
          (!chainId || record.order.chainId === chainId),
      ),
    [records, account, chainId],
  );
  return { records: scopedRecords, error };
}

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
        async checkPermission({ prepared, work }) {
          const allowance = await client.readContract({
            address: prepared.draft.tokenSell.address,
            abi: erc20Abi,
            functionName: "allowance",
            args:
              work.stage === "wallet"
                ? [prepared.account, prepared.poller]
                : [prepared.owner, GPV2_VAULT_RELAYER_ADDRESS],
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
