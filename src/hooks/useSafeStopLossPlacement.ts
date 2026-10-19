"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";

import { composableCowAbi } from "#/lib/abis/composableCow";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import {
  type ChainId,
  publicClientsFromIds,
  supportedChainIds,
} from "#/lib/publicClients";
import { readSafeTransaction } from "#/lib/safeApi";
import {
  createSafeStopLossPlacement,
  type SafePlacementRecord,
} from "#/lib/safeStopLossPlacement";

let controller: ReturnType<typeof createSafeStopLossPlacement> | undefined;

export function getSafeStopLossPlacement() {
  controller ??= createSafeStopLossPlacement();
  return controller;
}

const observations = new Map<string, Promise<SafePlacementRecord[]>>();

function observeSafePlacement(account: Address, chainId: ChainId) {
  const key = `${chainId}:${account.toLowerCase()}`;
  const existing = observations.get(key);
  if (existing) return existing;
  const task = getSafeStopLossPlacement()
    .refresh(
      { account, chainId },
      {
        readTransaction: readSafeTransaction,
        isCreated: (prepared) =>
          publicClientsFromIds[chainId].readContract({
            address: COMPOSABLE_COW_ADDRESS,
            abi: composableCowAbi,
            functionName: "singleOrders",
            args: [prepared.account, prepared.paramsHash],
          }),
      },
    )
    .finally(() => {
      observations.delete(key);
    });
  observations.set(key, task);
  return task;
}

export function useSafeStopLossPlacement(account?: Address, chainId?: ChainId) {
  const [records, setRecords] = useState<SafePlacementRecord[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!account) {
      setRecords([]);
      setError(undefined);
      return;
    }
    try {
      const placement = getSafeStopLossPlacement();
      const chains = chainId ? [chainId] : supportedChainIds;
      let previous: string | undefined;
      const update = () => {
        try {
          const records = chains.flatMap((chainId) =>
            placement.getRecords({ account, chainId }),
          );
          const revision = JSON.stringify(records, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          );
          if (revision !== previous) {
            previous = revision;
            setRecords(records);
          }
          setError(undefined);
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Safe placement tracking is unavailable",
          );
        }
      };
      update();
      const unsubscribe = placement.subscribe(update);
      let stopped = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const poll = async () => {
        try {
          for (const selectedChain of chains) {
            if (stopped) return;
            const scope = { account, chainId: selectedChain };
            if (
              placement
                .getRecords(scope)
                .some((record) => record.status === "pending")
            )
              await observeSafePlacement(account, selectedChain);
          }
        } catch (cause) {
          if (!stopped)
            setError(
              cause instanceof Error
                ? cause.message
                : "Safe placement tracking is unavailable",
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
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Safe placement tracking is unavailable",
      );
    }
  }, [account, chainId]);
  const scopedRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.prepared.account.toLowerCase() === account?.toLowerCase() &&
          (chainId === undefined || record.prepared.chainId === chainId),
      ),
    [records, account, chainId],
  );
  return { records: scopedRecords, error };
}
