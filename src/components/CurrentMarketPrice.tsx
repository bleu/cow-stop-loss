"use client";

import { formatNumber } from "@bleu/ui";
import { useFormContext, useWatch } from "react-hook-form";

import { SwapData } from "#/lib/types";

export function CurrentMarketPrice() {
  const { control } = useFormContext<SwapData>();

  const [tokenSell, tokenBuy, marketPrice] = useWatch({
    control,
    name: ["tokenSell", "tokenBuy", "marketPrice"],
  });

  if (!tokenSell || !tokenBuy || !marketPrice) return null;
  return (
    <span className="text-xs">
      Current market price: {tokenSell.symbol} = {formatNumber(marketPrice, 2)}{" "}
      {tokenBuy.symbol}
    </span>
  );
}
