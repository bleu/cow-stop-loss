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
    <section className="w-full rounded-2xl border border-border/80 bg-muted/55 p-3.5 transition-colors focus-within:border-primary/70 sm:p-4 min-[860px]:p-2">
      <div className="flex h-5 items-center justify-between gap-x-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <label htmlFor="trigger-price">Trigger price</label>
          <InfoTooltip text={TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE} side="right" />
        </span>
        {distance !== undefined && (
          <span
            className={`min-w-0 truncate normal-case tracking-normal text-[12px] font-semibold tabular-nums ${distance < -0.005 ? "text-destructive" : "text-foreground"}`}
          >
            {Math.abs(distance) < 0.005
              ? "At market"
              : `${Math.abs(distance).toFixed(2)}% ${distance >= 0 ? "below" : "above"} market`}
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-0">
        <Input
          {...register("strikePrice")}
          id="trigger-price"
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder="0.0"
          className="h-11 w-full rounded-xl border-none bg-transparent px-0 text-left text-3xl font-semibold tracking-tight tabular-nums shadow-none focus-visible:ring-transparent sm:text-4xl min-[860px]:h-8 min-[860px]:text-3xl"
        />
        <div className="flex h-5 w-full min-w-0 items-center text-[13px] text-muted-foreground">
          {tokenBuy && tokenSell && marketPrice && (
            <Button
              type="button"
              variant="link"
              className="h-5 min-w-0 max-w-full justify-start p-0 text-left text-[13px] font-medium text-primary underline-offset-4 hover:underline"
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
                Market: {formatMarketPrice(marketPrice)} {tokenBuy.symbol} per{" "}
                {tokenSell.symbol}
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
