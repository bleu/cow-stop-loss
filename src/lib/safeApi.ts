import {
  decodeEventLog,
  type Hex,
  isAddress,
  parseAbi,
  type PublicClient,
} from "viem";
import { z } from "zod";

import { publicClientsFromIds } from "./publicClients";
import type {
  SafeTransactionObservation,
  SafeTransactionReference,
} from "./safeStopLossPlacement";
import type { PlacementScope } from "./stopLossPlacement";

const hashSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/)
  .transform((value) => value as Hex);
const addressSchema = z.string().refine(isAddress);

export const safeTransactionSchema = z.object({
  safe: addressSchema,
  safeTxHash: hashSchema,
  nonce: z.string().regex(/^\d+$/),
  isExecuted: z.boolean(),
  isSuccessful: z.boolean().nullable(),
  transactionHash: hashSchema.nullable(),
});

export class SafeApiError extends Error {
  constructor(public status: number) {
    super(`Safe API request failed (${status})`);
  }
}

async function requestSafe(
  scope: PlacementScope,
  values: Record<string, string>,
) {
  const query = new URLSearchParams({ safe: scope.account, ...values });
  const response = await fetch(`/api/safe/${scope.chainId}?${query}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new SafeApiError(response.status);
  return response.json() as Promise<unknown>;
}

export async function readSafeTransaction(
  scope: PlacementScope,
  reference: SafeTransactionReference,
  {
    client = publicClientsFromIds[scope.chainId],
  }: { client?: PublicClient } = {},
): Promise<SafeTransactionObservation> {
  let data: unknown;
  try {
    data = await requestSafe(scope, {
      action: "transaction",
      hash: reference.id,
    });
  } catch (error) {
    if (
      reference.kind !== "unknown" ||
      !(error instanceof SafeApiError) ||
      error.status !== 404
    )
      throw error;
    try {
      const receipt = await client.getTransactionReceipt({
        hash: reference.id,
      });
      if (receipt.status === "reverted")
        return {
          status: "failed",
          reference: {
            ...reference,
            kind: "transaction",
            transactionHash: receipt.transactionHash,
          },
          error: "Safe execution reverted",
        };
      const abi = parseAbi([
        "event ExecutionSuccess(bytes32 txHash, uint256 payment)",
        "event ExecutionFailure(bytes32 txHash, uint256 payment)",
      ]);
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== scope.account.toLowerCase()) continue;
        try {
          const event = decodeEventLog({
            abi,
            topics: log.topics,
            data: log.data,
          });
          return {
            status:
              event.eventName === "ExecutionSuccess" ? "success" : "failed",
            reference: {
              id: event.args.txHash,
              kind: "proposal",
              transactionHash: receipt.transactionHash,
            },
          };
        } catch {
          // Other Safe events do not prove execution.
        }
      }
      throw new Error("Safe execution event is missing");
    } catch (receiptError) {
      if (
        receiptError instanceof Error &&
        receiptError.name === "TransactionReceiptNotFoundError"
      )
        return { status: "pending", reference };
      throw receiptError;
    }
  }
  const proposal = safeTransactionSchema.parse(data);
  if (
    proposal.safe.toLowerCase() !== scope.account.toLowerCase() ||
    proposal.safeTxHash.toLowerCase() !== reference.id.toLowerCase()
  )
    throw new Error("Safe API returned another transaction");
  const resolved: SafeTransactionReference = {
    ...reference,
    kind: "proposal",
    nonce: BigInt(proposal.nonce),
    transactionHash: proposal.transactionHash ?? undefined,
  };
  if (
    proposal.isExecuted &&
    proposal.isSuccessful !== null &&
    proposal.transactionHash
  )
    return {
      status: proposal.isSuccessful ? "success" : "failed",
      reference: resolved,
    };
  const replacements = z
    .object({ results: z.array(safeTransactionSchema) })
    .parse(
      await requestSafe(scope, {
        action: "replacements",
        nonce: proposal.nonce,
      }),
    );
  const consumed = replacements.results.some(
    (transaction) =>
      transaction.safe.toLowerCase() === scope.account.toLowerCase() &&
      BigInt(transaction.nonce) === BigInt(proposal.nonce) &&
      transaction.safeTxHash.toLowerCase() !==
        proposal.safeTxHash.toLowerCase() &&
      transaction.isExecuted &&
      transaction.transactionHash !== null,
  );
  return { status: consumed ? "cancelled" : "pending", reference: resolved };
}
