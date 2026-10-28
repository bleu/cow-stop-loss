import { useEffect, useId, useState } from "react";
import useSWR from "swr";
import { type Address, parseUnits } from "viem";

import { fetchSellQuote } from "#/lib/cowApi/quote";
import { DEFAULT_SLIPPAGE_PERCENT } from "#/lib/orderSlippage";
import type { ChainId } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { useDebounce } from "./useDebounce";

interface OrderQuoteInput {
  chainId: ChainId;
  account?: Address;
  tokenSell?: IToken;
  tokenBuy?: IToken;
  amountSell: string;
  oraclePrice?: number;
  enabled?: boolean;
}

export function useOrderQuote({
  chainId,
  account,
  tokenSell,
  tokenBuy,
  amountSell,
  oraclePrice,
  enabled = true,
}: OrderQuoteInput) {
  let amount: string | undefined;
  if (
    tokenSell &&
    /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(amountSell) &&
    (amountSell.split(".")[1]?.length ?? 0) <= tokenSell.decimals
  ) {
    const atoms = parseUnits(amountSell, tokenSell.decimals);
    if (atoms > BigInt(0)) amount = atoms.toString();
  }
  const request =
    amount && account && tokenSell && tokenBuy
      ? JSON.stringify([
          chainId,
          account.toLowerCase(),
          tokenSell.address.toLowerCase(),
          tokenBuy.address.toLowerCase(),
          tokenSell.decimals,
          tokenBuy.decimals,
          amount,
        ])
      : null;
  const debounced = useDebounce(request);
  const session = useId();
  const price =
    oraclePrice !== undefined && Number.isFinite(oraclePrice) && oraclePrice > 0
      ? oraclePrice.toFixed(18)
      : undefined;
  const [revision, setRevision] = useState({
    request: debounced,
    number: 0,
    oraclePrice: price,
  });
  useEffect(() => {
    if (!enabled) return;
    setRevision((current) => {
      if (current.request !== debounced)
        return {
          request: debounced,
          number: current.number + 1,
          oraclePrice: price,
        };
      if (!current.oraclePrice && price)
        return { ...current, oraclePrice: price };
      return current;
    });
  }, [debounced, enabled, price]);
  const ready =
    enabled &&
    request === revision.request &&
    request !== null &&
    request === debounced &&
    revision.oraclePrice !== undefined;
  const options = {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  };
  const quote = useSWR(
    ready
      ? (["order-quote", session, revision.number, request] as const)
      : null,
    async () => {
      const price = revision.oraclePrice!;
      const buyAmount = await fetchSellQuote({
        chainId,
        account: account!,
        sellToken: tokenSell!.address,
        buyToken: tokenBuy!.address,
        sellAmount: amount!,
      });
      return {
        buyAmount,
        sellAmount: BigInt(amount!),
        sellDecimals: tokenSell!.decimals,
        buyDecimals: tokenBuy!.decimals,
        oraclePrice: price,
      };
    },
    options,
  );
  return {
    slippagePercent: DEFAULT_SLIPPAGE_PERCENT,
    isLoading: Boolean(request) && (!ready || quote.isLoading),
    quoteError: quote.error as Error | undefined,
    hasQuote: Boolean(quote.data) && !quote.error,
    hasInput: Boolean(request),
  };
}
