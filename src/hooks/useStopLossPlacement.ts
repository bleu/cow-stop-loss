"use client";

import { useEffect, useState } from "react";
import {
  Address,
  erc20Abi,
  PublicClient,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";

import { invalidatePlacementReads } from "#/lib/placementReads";
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
  TransactionReference,
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
      let previousRevision: string | undefined;
      const update = () => {
        try {
          const records = chains.flatMap((selectedChain) =>
            placement.getRecords({ account, chainId: selectedChain }),
          );
          const revision = JSON.stringify(
            records.map(({ id, revision }) => [id, revision]),
          );
          if (previousRevision !== undefined && revision !== previousRevision)
            for (const chainId of chains)
              invalidatePlacementReads({ account, chainId });
          previousRevision = revision;
          setRecords(records);
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
  const placement = getStopLossPlacement();
  const scope = { account, chainId };
  const pending = placement
    .getRecords(scope)
    .some(
      (record) => record.status === "pending" || record.status === "prompting",
    );
  const records = await placement.resume(scope, placementReader(chainId));
  if (pending) invalidatePlacementReads(scope);
  return records;
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

export async function readStopLossTransaction(
  reference: TransactionReference,
  client: PublicClient,
  saveReference?: (reference: TransactionReference) => Promise<void>,
): Promise<
  Awaited<ReturnType<NonNullable<PlacementReader["readTransaction"]>>>
> {
  if (!reference.transactionHash) return { status: "pending" };
  reference = structuredClone(reference);
  try {
    if (!reference.submitted) {
      try {
        const transaction = await client.getTransaction({
          hash: reference.transactionHash!,
        });
        reference.submitted = {
          from: transaction.from,
          to: transaction.to,
          input: transaction.input,
          value: transaction.value,
          nonce: transaction.nonce,
          nextBlock: transaction.blockNumber ?? (await client.getBlockNumber()),
        };
      } catch {
        // The original transaction can be unavailable before or after replacement.
      }
    }
    if (reference.submitted) await findStopLossReplacement(reference, client);
    await saveReference?.(reference);
    let replacementError = reference.replacementError;
    const receipt = await client.waitForTransactionReceipt({
      hash: reference.transactionHash!,
      timeout: 10000,
      onReplaced: ({ reason, replacedTransaction, transaction }) => {
        if (transaction?.hash) reference.transactionHash = transaction.hash;
        if (reason === "cancelled") replacementError = "Transaction cancelled";
        else if (
          !replacedTransaction ||
          !transaction ||
          replacedTransaction.from.toLowerCase() !==
            transaction.from.toLowerCase() ||
          replacedTransaction.to?.toLowerCase() !==
            transaction.to?.toLowerCase() ||
          replacedTransaction.value !== transaction.value ||
          replacedTransaction.input.toLowerCase() !==
            transaction.input.toLowerCase()
        )
          replacementError = "Transaction replaced with a different action";
        reference.replacementError = replacementError;
      },
    });
    return {
      status:
        receipt.status === "success" && !replacementError
          ? "success"
          : "failed",
      error:
        replacementError ??
        (receipt.status === "reverted" ? "Transaction reverted" : undefined),
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
      return { status: "pending", reference };
    return {
      status: "pending",
      reference,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function findStopLossReplacement(
  reference: TransactionReference,
  client: PublicClient,
) {
  const submitted = reference.submitted!;
  const latest = await client.getBlockNumber();
  const end =
    latest < submitted.nextBlock + BigInt(99)
      ? latest
      : submitted.nextBlock + BigInt(99);
  for (
    let blockNumber = submitted.nextBlock;
    blockNumber <= end;
    blockNumber++
  ) {
    const block = await client.getBlock({
      blockNumber,
      includeTransactions: true,
    });
    const replacement = block.transactions.find(
      (transaction) =>
        transaction.from.toLowerCase() === submitted.from.toLowerCase() &&
        transaction.nonce === submitted.nonce,
    );
    submitted.nextBlock = blockNumber + BigInt(1);
    if (!replacement) continue;
    reference.transactionHash = replacement.hash;
    if (
      submitted.to?.toLowerCase() !== replacement.to?.toLowerCase() ||
      submitted.value !== replacement.value ||
      submitted.input.toLowerCase() !== replacement.input.toLowerCase()
    )
      reference.replacementError =
        "Transaction replaced with a different action";
    break;
  }
}

function placementReader(chainId: ChainId): PlacementReader {
  const client = publicClientsFromIds[chainId];
  return {
    readTransaction: (_record, reference, saveReference) =>
      readStopLossTransaction(reference, client, saveReference),
    async checkState(record) {
      if (record.stage === "setup")
        return verifyPlacementConfirmation(record.prepared, {
          client,
          requiredSettlementAllowance: record.settlementAmount,
        });
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
