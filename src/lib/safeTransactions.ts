import { type Address, type Hex, toHex } from "viem";
import { z } from "zod";

import type { ChainId } from "./publicClients";
import type { SafeCall } from "./safeStopLoss";
import type { SafeTransactionReference } from "./safeStopLossPlacement";
import { PlacementNotSubmittedError } from "./stopLossPlacement";

export type SafeRpcProvider = {
  request(request: { method: string; params?: unknown[] }): Promise<unknown>;
};

export type SafeAppsTransactionClient = {
  txs: {
    send(request: {
      txs: { to: string; data: string; value: string }[];
    }): Promise<{ safeTxHash: string }>;
  };
};

export type SafeSubmission = {
  calls: SafeCall[];
  reference: SafeTransactionReference;
};

const batchResult = z.object({ id: z.string().regex(/^0x[0-9a-fA-F]{64}$/) });

export function createSafeTransactionSender({
  account,
  chainId,
  provider,
  sdk,
}: {
  account: Address;
  chainId: ChainId;
} & (
  | { provider: SafeRpcProvider; sdk?: never }
  | { sdk: SafeAppsTransactionClient; provider?: never }
)) {
  async function mode(): Promise<"batch" | "sequential"> {
    if (sdk) return "batch";
    try {
      const capabilities = z
        .record(
          z.object({
            atomic: z.object({ status: z.string() }).optional(),
            atomicBatch: z.object({ supported: z.boolean() }).optional(),
          }),
        )
        .parse(
          await provider.request({
            method: "wallet_getCapabilities",
            params: [account, [toHex(chainId)]],
          }),
        );
      const capability = capabilities[toHex(chainId)];
      return capability?.atomic?.status === "supported" ||
        capability?.atomicBatch?.supported === true
        ? "batch"
        : "sequential";
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === -32601 || error.code === 4200 || error.code === -32004)
      )
        return "sequential";
      throw error;
    }
  }

  async function send(
    calls: SafeCall[],
    { expectedMode }: { expectedMode?: "batch" | "sequential" } = {},
  ): Promise<SafeSubmission> {
    const submissionMode = await mode();
    if (expectedMode && submissionMode !== expectedMode)
      throw new PlacementNotSubmittedError(
        "Safe submission mode changed. Review the order again.",
      );
    if (sdk) {
      const response = await sdk.txs.send({
        txs: calls.map(({ to, data, value }) => ({
          to,
          data,
          value: value.toString(),
        })),
      });
      const result = batchResult.parse({ id: response.safeTxHash });
      return { calls, reference: { id: result.id as Hex, kind: "proposal" } };
    }
    const connectedChain = await provider.request({ method: "eth_chainId" });
    const accounts = z
      .array(z.string())
      .parse(await provider.request({ method: "eth_accounts" }));
    if (
      BigInt(z.string().parse(connectedChain)) !== BigInt(chainId) ||
      !accounts.some(
        (address) => address.toLowerCase() === account.toLowerCase(),
      )
    )
      throw new PlacementNotSubmittedError(
        "Wallet or chain changed. Review the order again.",
      );
    if (submissionMode === "sequential") {
      const call = calls[0];
      const id = z
        .string()
        .regex(/^0x[0-9a-fA-F]{64}$/)
        .parse(
          await provider.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: account,
                to: call.to,
                data: call.data,
                value: toHex(call.value),
                chainId: toHex(chainId),
              },
            ],
          }),
        );
      return { calls: [call], reference: { id: id as Hex, kind: "unknown" } };
    }
    // Safe returns safeTxHash as the calls ID: https://github.com/safe-global/safe-wallet-monorepo/blob/main/apps/web/src/services/safe-wallet-provider/index.ts
    const result = batchResult.parse(
      await provider.request({
        method: "wallet_sendCalls",
        params: [
          {
            version: "2.0.0",
            chainId: toHex(chainId),
            from: account,
            atomicRequired: true,
            calls: calls.map(({ to, data, value }) => ({
              to,
              data,
              value: toHex(value),
            })),
          },
        ],
      }),
    );
    return { calls, reference: { id: result.id as Hex, kind: "proposal" } };
  }
  return { send, mode };
}
