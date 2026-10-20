import { Button, Input } from "@bleu/ui";
import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { SwapData } from "#/lib/types";
import { formatMarketPriceForInput } from "#/utils/priceFormatting";

import { InfoTooltip } from "./ui/tooltip";

export const PriceInputCard = memo(PriceInputCardComponent);

function PriceInputCardComponent({ disabled }: { disabled?: boolean }) {
  const { register, control, setValue } = useFormContext<SwapData>();
  const [tokenBuy, tokenSell] = useWatch({
    control,
    name: ["tokenBuy", "tokenSell"],
  });
  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);
  const triggerPrice = useWatch({ control, name: "strikePrice" });
  const distance =
    marketPrice && Number(triggerPrice)
      ? ((marketPrice - Number(triggerPrice)) / marketPrice) * 100
      : undefined;
  return (
    <section className="rescue-price-card pixel-inset w-full rounded-none border border-border/80 bg-muted/35 p-3 transition-colors focus-within:border-primary/70">
      <div className="rescue-price-heading flex flex-wrap items-center justify-between gap-x-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <label htmlFor="trigger-price">Trigger price</label>
          <InfoTooltip text={TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE} side="right" />
        </span>
        {distance !== undefined && (
          <span
            className={`rescue-price-distance min-w-0 truncate normal-case tracking-normal text-[12px] font-semibold tabular-nums ${distance < -0.005 ? "text-destructive" : "text-foreground"}`}
          >
            {Math.abs(distance) < 0.005
              ? "At market"
              : `${Math.abs(distance).toFixed(2)}% ${distance >= 0 ? "below" : "above"} market`}
          </span>
        )}
      </div>
      <div className="rescue-price-body flex flex-col items-start gap-0">
        <Input
          {...register("strikePrice")}
          id="trigger-price"
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder="0.0"
          className="h-11 w-full rounded-none border-none bg-transparent px-0 text-left text-[28px] font-semibold tracking-tight tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[32px]"
        />
        <div className="rescue-market-price flex h-5 w-full min-w-0 items-center text-[13px] text-muted-foreground empty:hidden [&:has(button)]:h-11">
          {tokenBuy && tokenSell && marketPrice && (
            <Button
              type="button"
              variant="link"
              className="rescue-secondary-control min-h-11 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 max-w-full justify-start p-0 text-left text-xs font-medium text-primary underline-offset-4 hover:underline"
              aria-label={`Set trigger to current market price ${formatMarketPrice(marketPrice)} ${tokenBuy.symbol} per ${tokenSell.symbol}`}
              onClick={() =>
                setValue(
                  "strikePrice",
                  formatMarketPriceForInput(marketPrice),
                  { shouldValidate: true, shouldDirty: true },
                )
              }
            >
              <span className="truncate">
                Market: ${formatMarketPrice(marketPrice)}
              </span>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function formatMarketPrice(price: number) {
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 7 }).format(
    price,
  );
}
