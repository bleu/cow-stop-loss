import type { PublicClient } from "viem";

import { fetchOracleUsdPriceSnapshot } from "./oraclePrice";
import type { ChainId } from "./publicClients";
import { getSupportedTokens } from "./supportedTokens";
import type { IToken } from "./types";

export const ORDER_SIZE_LIMIT_USD = BigInt(10_000);
export const ORDER_SIZE_LIMIT_LABEL = "$10,000";
export const ORDER_SIZE_LIMIT_EXCEEDED_ERROR = `Order size exceeds the ${ORDER_SIZE_LIMIT_LABEL} limit. Reduce the sell amount.`;
export const ORDER_SIZE_PRICE_UNAVAILABLE_ERROR = `Cannot verify the ${ORDER_SIZE_LIMIT_LABEL} order size limit: a fresh USD price is unavailable.`;

export function isWithinOrderSizeLimit({
  sellAmount,
  tokenDecimals,
  answer,
  oracleDecimals,
}: {
  sellAmount: bigint;
  tokenDecimals: number;
  answer: bigint;
  oracleDecimals: number;
}): boolean {
  if (sellAmount < BigInt(0))
    throw new Error("Sell amount must not be negative");
  if (
    answer <= BigInt(0) ||
    !Number.isInteger(tokenDecimals) ||
    tokenDecimals < 0 ||
    tokenDecimals > 255 ||
    !Number.isInteger(oracleDecimals) ||
    oracleDecimals < 0 ||
    oracleDecimals > 255
  )
    throw new Error(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
  return (
    sellAmount * answer <=
    ORDER_SIZE_LIMIT_USD * BigInt(10) ** BigInt(tokenDecimals + oracleDecimals)
  );
}

export async function assertOrderSizeLimit({
  chainId,
  tokenSell,
  sellAmount,
  client,
}: {
  chainId: ChainId;
  tokenSell: IToken;
  sellAmount: bigint;
  client?: PublicClient;
}): Promise<void> {
  if (sellAmount < BigInt(0))
    throw new Error("Sell amount must not be negative");
  let snapshot: Awaited<ReturnType<typeof fetchOracleUsdPriceSnapshot>>;
  let tokenDecimals: number;
  try {
    const { sellTokens } = getSupportedTokens(chainId);
    const configured = sellTokens.find(
      ({ token }) =>
        token.address.toLowerCase() === tokenSell.address.toLowerCase() &&
        token.decimals === tokenSell.decimals,
    );
    if (!configured?.oracles.USD)
      throw new Error("No configured USD price feed for the sell token");
    tokenDecimals = configured.token.decimals;
    snapshot = await fetchOracleUsdPriceSnapshot({
      chainId,
      oracle: configured.oracles.USD,
      client,
    });
  } catch {
    throw new Error(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
  }
  if (
    !isWithinOrderSizeLimit({
      sellAmount,
      tokenDecimals,
      answer: snapshot.answer,
      oracleDecimals: snapshot.decimals,
    })
  )
    throw new Error(ORDER_SIZE_LIMIT_EXCEEDED_ERROR);
}
