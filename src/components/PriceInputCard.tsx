import { Button, Input } from "@bleu/ui";
import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { SwapData } from "#/lib/types";

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
    <section className="w-full rounded-2xl border border-border/70 bg-card/55 p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
          <label htmlFor="trigger-price">Trigger price</label>
          <InfoTooltip text={TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE} side="right" />
        </span>
      </div>
      <div className="flex flex-col items-start gap-0">
        <Input
          {...register("strikePrice")}
          id="trigger-price"
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder="0.0"
          className="h-11 w-full rounded-xl border-none bg-transparent px-0 text-left text-3xl font-semibold tracking-tight tabular-nums shadow-none focus-visible:ring-transparent sm:text-4xl"
        />
        {tokenBuy && tokenSell && (
          <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            {marketPrice ? (
              <Button
                type="button"
                variant="link"
                className="h-auto min-w-0 justify-start p-0 text-left text-[13px] font-medium text-primary underline-offset-4 hover:underline"
                aria-label={`Set trigger to current market price ${formatMarketPrice(marketPrice)} ${tokenBuy.symbol} per ${tokenSell.symbol}`}
                onClick={() =>
                  setValue(
                    "strikePrice",
                    marketPrice.toFixed(18).replace(/\.?0+$/, ""),
                    { shouldValidate: true, shouldDirty: true },
                  )
                }
              >
                Current market price is {formatMarketPrice(marketPrice)}{" "}
                {tokenBuy.symbol} per {tokenSell.symbol}
              </Button>
            ) : (
              <span>Current market price is loading</span>
            )}
            {distance !== undefined && (
              <span
                className={`ml-auto whitespace-nowrap font-semibold tabular-nums ${distance < -0.005 ? "text-destructive" : "text-foreground"}`}
              >
                {Math.abs(distance) < 0.005
                  ? "At market"
                  : `${Math.abs(distance).toFixed(2)}% ${distance >= 0 ? "below" : "above"} market`}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function formatMarketPrice(price: number) {
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 7 }).format(
    price,
  );
}
