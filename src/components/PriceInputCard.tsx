import { Button, Input } from "@bleu/ui";
import { memo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { SwapData } from "#/lib/types";
import { formatMarketPriceForInput } from "#/utils/priceFormatting";

import { InfoTooltip } from "./ui/tooltip";

export const PriceInputCard = memo(PriceInputCardComponent);

function PriceInputCardComponent({ disabled }: { disabled?: boolean }) {
  const { register, control, setValue } = useFormContext<SwapData>();
  const [mode, setMode] = useState<"price" | "percent">("price");
  const [percent, setPercent] = useState("");
  const [percentInvalid, setPercentInvalid] = useState(false);
  const [tokenBuy, tokenSell] = useWatch({
    control,
    name: ["tokenBuy", "tokenSell"],
  });
  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);
  const hasMarketPrice =
    marketPrice !== undefined &&
    Number.isFinite(marketPrice) &&
    marketPrice > 0;
  const triggerPrice = useWatch({ control, name: "strikePrice" });
  const distance =
    marketPrice && Number(triggerPrice)
      ? ((marketPrice - Number(triggerPrice)) / marketPrice) * 100
      : undefined;
  return (
    <section className="rescue-price-card pixel-inset w-full rounded-none border border-border/80 bg-muted/35 p-3 transition-colors focus-within:border-primary/70">
      <div className="rescue-price-heading flex flex-wrap items-center justify-between gap-x-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <label
            htmlFor={mode === "percent" ? "trigger-drop" : "trigger-price"}
          >
            Trigger price
          </label>
          <InfoTooltip text={TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE} side="right" />
        </span>
        <div
          role="group"
          aria-label="Trigger input mode"
          className="flex shrink-0 border border-border/60 p-0.5 normal-case tracking-normal"
        >
          {(["price", "percent"] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled || (value === "percent" && !hasMarketPrice)}
              aria-pressed={mode === value}
              onClick={() => {
                if (value === mode) return;
                setPercentInvalid(false);
                if (value === "percent")
                  setPercent(
                    marketPrice && Number(triggerPrice) > 0
                      ? String(
                          Number(
                            (
                              (1 - Number(triggerPrice) / marketPrice) *
                              100
                            ).toFixed(8),
                          ),
                        )
                      : "",
                  );
                setMode(value);
              }}
              className={`min-h-7 px-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${mode === value ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
            >
              {value === "price" ? "Price" : "% drop"}
            </button>
          ))}
        </div>
      </div>
      <div className="rescue-price-body grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
        {mode === "percent" ? (
          <Input
            key="percent"
            id="trigger-drop"
            aria-label="Price drop (%)"
            aria-invalid={percentInvalid}
            aria-describedby={
              percentInvalid
                ? "trigger-drop-error"
                : !hasMarketPrice
                  ? "trigger-drop-help"
                  : undefined
            }
            type="text"
            inputMode="decimal"
            disabled={disabled || !hasMarketPrice}
            value={percent}
            onChange={(event) => {
              const value = event.target.value;
              setPercent(value);
              const validPercent =
                /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) &&
                Number(value) >= 0 &&
                Number(value) < 100;
              const calculated =
                validPercent &&
                marketPrice &&
                Number.isFinite(marketPrice) &&
                marketPrice > 0
                  ? (marketPrice * (1 - Number(value) / 100))
                      .toFixed(18)
                      .replace(/\.?0+$/, "")
                  : "";
              const price =
                /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(calculated) &&
                Number(calculated) > 0
                  ? calculated
                  : "";
              setPercentInvalid(!price);
              setValue("strikePrice", price, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            placeholder="0.0"
            className="h-11 w-full min-w-0 rounded-none border-none bg-transparent px-0 text-left text-[28px] font-semibold tracking-tight tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[32px]"
          />
        ) : (
          <Input
            key="price"
            {...register("strikePrice")}
            id="trigger-price"
            type="text"
            inputMode="decimal"
            disabled={disabled}
            placeholder="0.0"
            className="h-11 w-full min-w-0 rounded-none border-none bg-transparent px-0 text-left text-[28px] font-semibold tracking-tight tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[32px]"
          />
        )}
        <span
          aria-hidden="true"
          className="shrink-0 text-sm text-muted-foreground"
        >
          {mode === "percent"
            ? "% drop"
            : tokenBuy && tokenSell
              ? `${tokenBuy.symbol} per ${tokenSell.symbol}`
              : ""}
        </span>
        <div className="rescue-market-price col-span-2 flex h-5 w-full min-w-0 items-center justify-between gap-2 text-[13px] text-muted-foreground empty:hidden [&:has(button)]:h-11">
          {tokenBuy && tokenSell && marketPrice && (
            <Button
              type="button"
              variant="link"
              disabled={disabled}
              className="rescue-secondary-control min-h-11 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 max-w-full justify-start p-0 text-left text-xs font-medium text-primary underline-offset-4 hover:underline"
              aria-label={`Set trigger to current market price ${formatMarketPrice(marketPrice)} ${tokenBuy.symbol} per ${tokenSell.symbol}`}
              onClick={() => {
                setMode("price");
                setPercentInvalid(false);
                setValue(
                  "strikePrice",
                  formatMarketPriceForInput(marketPrice),
                  { shouldValidate: true, shouldDirty: true },
                );
              }}
            >
              <span className="truncate">
                Market: ${formatMarketPrice(marketPrice)}
              </span>
            </Button>
          )}
          {mode === "percent"
            ? Number(triggerPrice) > 0 &&
              tokenBuy &&
              tokenSell && (
                <span
                  className="rescue-price-distance ml-auto min-w-0 truncate text-right text-xs text-muted-foreground tabular-nums"
                  title={`${triggerPrice} ${tokenBuy.symbol} per ${tokenSell.symbol}`}
                  aria-live="polite"
                >
                  Trigger: ${formatMarketPrice(Number(triggerPrice))}
                </span>
              )
            : distance !== undefined && (
                <span
                  className={`rescue-price-distance ml-auto min-w-0 truncate text-right text-xs tabular-nums ${distance < -0.005 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {Math.abs(distance) < 0.005
                    ? "At market"
                    : `${Math.abs(distance).toFixed(2)}% ${distance >= 0 ? "below" : "above"} market`}
                </span>
              )}
        </div>
      </div>
      {mode === "percent" && !hasMarketPrice && (
        <p id="trigger-drop-help" className="text-xs text-muted-foreground">
          Percentage entry needs a current market price. Use Price to continue.
        </p>
      )}
      {mode === "percent" && percentInvalid && (
        <p
          id="trigger-drop-error"
          role="alert"
          className="text-xs text-destructive"
        >
          Enter a drop from 0% to less than 100%.
        </p>
      )}
    </section>
  );
}

function formatMarketPrice(price: number) {
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 7 }).format(
    price,
  );
}
