"use client";

import { formatNumber } from "@bleu/ui";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { useTokenPrice } from "#/hooks/useTokenPrice";
import { SwapData } from "#/lib/types";

export function CurrentMarketPrice() {
  const { control } = useFormContext<SwapData>();
  const [tokenSell, tokenBuy] = useWatch({
    control,
    name: ["tokenSell", "tokenBuy"],
  });
  const { data: tokenSellPrice } = useTokenPrice(tokenSell);
  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  if (!tokenSell || !tokenBuy || !marketPrice || marketPrice <= 0) return null;

  return (
    <div className="text-xs font-mono p-2 rounded-lg text-white flex items-center justify-between">
      <span className="w-24 opacity-50">1 {tokenSell.symbol}</span>
      <div className="flex items-center justify-end flex-1 space-x-2">
        <span className="text-right whitespace-nowrap">
          {formatNumber(marketPrice, 6, "decimal", "standard")}{" "}
          {tokenBuy.symbol}
        </span>
        {tokenSellPrice && (
          <span className="opacity-50 text-right whitespace-nowrap">
            ~{formatNumber(tokenSellPrice, 6, "currency", "standard")}
          </span>
        )}
      </div>
    </div>
  );
}
