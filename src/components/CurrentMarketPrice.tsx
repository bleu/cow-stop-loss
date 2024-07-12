"use client";

import { formatNumber } from "@bleu/ui";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokens } from "#/contexts/tokensContext";
import { SwapData } from "#/lib/types";

import { InfoTooltip } from "./Tooltip";

export function CurrentMarketPrice() {
  const { control } = useFormContext<SwapData>();
  const [tokenSell, tokenBuy] = useWatch({
    control,
    name: ["tokenSell", "tokenBuy"],
  });

  const { useTokenPairPrice } = useTokens();
  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  if (!tokenSell || !tokenBuy || !marketPrice || marketPrice <= 0) return null;

  const formatPrice = (price: number) => formatNumber(price, 4);
  const inversePrice = 1 / marketPrice;

  return (
    <div className="text-xs flex items-center space-x-1">
      <span>Current market price:</span>
      <span className="font-medium">
        1 {tokenSell.symbol} = {formatPrice(marketPrice)} {tokenBuy.symbol}
      </span>
      <InfoTooltip
        // @ts-expect-error
        text={
          <div className="grid grid-cols-[auto,auto] gap-x-2 whitespace-nowrap">
            <span>1 {tokenSell.symbol} =</span>
            <span>
              {formatPrice(marketPrice)} {tokenBuy.symbol}
            </span>
            <span>1 {tokenBuy.symbol} =</span>
            <span>
              {formatPrice(inversePrice)} {tokenSell.symbol}
            </span>
          </div>
        }
      />
    </div>
  );
}
