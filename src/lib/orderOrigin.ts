import { AppDataSdk } from "@cowprotocol/sdk-app-data";
import { type Hex, keccak256, stringToHex } from "viem";

import { COW_API_URL_BY_CHAIN_ID } from "./cowApi/api";
import type { StopLossOrder } from "./stopLossOrders";

export type OrderOrigin = "app" | "other" | "unknown";

const appCode = "bleu-stop-loss";
const appDataSdk = new AppDataSdk();
const origins = new Map<string, Promise<OrderOrigin>>();

function isAppDataHash(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[\da-f]{64}$/i.test(value);
}

export async function getLocalOrderOrigin(
  fullAppData: string,
  appDataHash: Hex,
): Promise<OrderOrigin> {
  try {
    if (!isAppDataHash(appDataHash)) return "unknown";
    const document = JSON.parse(fullAppData);
    const validation = await appDataSdk.validateAppDataDoc(document);
    if (!validation.success) return "unknown";
    // Hash the exact document bytes without changing the SDK's shared provider adapter.
    if (keccak256(stringToHex(fullAppData)) !== appDataHash.toLowerCase()) {
      return "unknown";
    }
    const codes: unknown[] = [
      document.appCode,
      document.metadata?.widget?.appCode,
    ];
    if (codes.includes(appCode)) return "app";
    return codes.some((code) => typeof code === "string" && code.trim() !== "")
      ? "other"
      : "unknown";
  } catch {
    return "unknown";
  }
}

export function getOrderOrigin(order: StopLossOrder): Promise<OrderOrigin> {
  if (!isAppDataHash(order.appData)) return Promise.resolve("unknown");
  const hash = order.appData.toLowerCase() as Hex;
  const key = `${order.chainId}:${hash}`;
  const cached = origins.get(key);
  if (cached) return cached;

  const origin = fetchOrderOrigin(order.chainId, hash);
  origins.set(key, origin);
  return origin;
}

async function fetchOrderOrigin(
  chainId: StopLossOrder["chainId"],
  hash: Hex,
): Promise<OrderOrigin> {
  try {
    const response = await fetch(
      `${COW_API_URL_BY_CHAIN_ID[chainId]}/api/v1/app_data/${hash}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return "unknown";
    const body: unknown = await response.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("fullAppData" in body) ||
      typeof body.fullAppData !== "string"
    ) {
      return "unknown";
    }
    return await getLocalOrderOrigin(body.fullAppData, hash);
  } catch {
    return "unknown";
  }
}
