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

  if (!tokenSell || !tokenBuy || !marketPrice || marketPrice <= 0) return null;
  return (
    <span className="text-xs">
      Current market price: {tokenSell.symbol} = {formatNumber(marketPrice, 4)}{" "}
      {tokenBuy.symbol}
    </span>
  );
}
