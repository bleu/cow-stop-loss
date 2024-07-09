"use client";

import { formatNumber } from "@bleu/ui";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokens } from "#/contexts/tokensContext";
import { SwapData } from "#/lib/types";

export function CurrentMarketPrice() {
  const { control } = useFormContext<SwapData>();

  const [tokenSell, tokenBuy] = useWatch({
    control,
    name: ["tokenSell", "tokenBuy"],
  });

  const { useTokenPairPrice } = useTokens();
  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  if (!tokenSell || !tokenBuy || !marketPrice || marketPrice <= 0) return null;
  return (
    <span className="text-xs">
      Current market price:{" "}
      <b>
        {tokenSell.symbol} = {formatNumber(marketPrice, 4)}{" "}
      </b>
      {tokenBuy.symbol}
    </span>
  );
}
