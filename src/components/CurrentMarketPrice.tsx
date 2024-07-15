"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  formatNumber,
} from "@bleu/ui";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  const { data: tokenBuyPrice } = useTokenPrice(tokenBuy);
  const { data: tokenSellPrice } = useTokenPrice(tokenSell);
  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  if (!tokenSell || !tokenBuy || !marketPrice || marketPrice <= 0) return null;

  const formatPrice = (price: number) =>
    formatNumber(price, 6, "currency", "standard");
  const formatDecimal = (price: number) =>
    formatNumber(price, 6, "decimal", "standard");
  const inversePrice = 1 / marketPrice;

  return (
    <div className="text-xs font-mono p-2 rounded-lg text-white inline-block">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between">
          <span className="w-24 flex space-x-1 hover:opacity-100 opacity-50">
            <span>1 {tokenSell.symbol} </span>
            <CollapsibleTrigger>
              {open ? (
                <ChevronUpIcon className="size-3" />
              ) : (
                <ChevronDownIcon className="size-3" />
              )}
            </CollapsibleTrigger>
          </span>

          <div className="flex items-center justify-end flex-1 space-x-2">
            <span className="text-right whitespace-nowrap">
              {formatDecimal(marketPrice)} {tokenBuy.symbol}
            </span>
            {tokenSellPrice && (
              <span className="opacity-50 text-right whitespace-nowrap">
                ~{formatPrice(tokenSellPrice)}
              </span>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="flex items-center justify-between mt-1">
            <span className="w-24 hover:opacity-100 opacity-50">
              1 {tokenBuy.symbol}
            </span>
            <div className="flex items-center justify-end flex-1 space-x-2">
              <span className="text-right whitespace-nowrap">
                {formatDecimal(inversePrice)} {tokenSell.symbol}
              </span>
              {tokenBuyPrice && (
                <span className="opacity-50 text-right whitespace-nowrap">
                  ~{formatPrice(tokenBuyPrice)}
                </span>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
