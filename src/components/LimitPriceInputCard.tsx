import { Input } from "@bleu/ui";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  calculateLimitPrice,
  calculateSlippagePercent,
} from "#/lib/calculateAmounts";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { SwapData } from "#/lib/types";
import { formatInputAmount, formatTokenAmount } from "#/utils/amountFormatting";
import { isDecimalInput } from "#/utils/inputs";

import { InfoTooltip } from "./ui/tooltip";

export function LimitPriceInputCard({
  defaultSlippage,
  onManualEdit,
  onResetToDefault,
}: {
  defaultSlippage: boolean;
  onManualEdit: () => void;
  onResetToDefault: () => void;
}) {
  const [view, setView] = useState<"price" | "slippage">("price");
  const {
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<SwapData>();
  const [
    strikePrice,
    slippagePercent,
    limitPriceSource,
    price,
    tokenBuy,
    tokenSell,
  ] = useWatch({
    control,
    name: [
      "strikePrice",
      "slippagePercent",
      "limitPriceSource",
      "limitPrice",
      "tokenBuy",
      "tokenSell",
    ],
  });
  let limitPrice = "";
  let slippage = "";
  let calculationError: string | undefined;
  try {
    limitPrice = calculateLimitPrice({
      strikePrice,
      slippagePercent,
      limitPriceSource,
      limitPrice: price,
    });
    slippage =
      limitPriceSource === "price"
        ? calculateSlippagePercent(strikePrice, limitPrice)
        : slippagePercent;
  } catch (error) {
    if (error instanceof Error && !error.message.startsWith("Trigger price"))
      calculationError = error.message;
  }
  const pair =
    tokenBuy && tokenSell ? `${tokenBuy.symbol} per ${tokenSell.symbol}` : "";
  const value =
    view === "price"
      ? limitPriceSource === "price"
        ? (price ?? "")
        : formatInputAmount(limitPrice)
      : limitPriceSource === "price"
        ? formatInputAmount(slippage)
        : slippagePercent;
  const error =
    calculationError ??
    errors.limitPrice?.message ??
    errors.slippagePercent?.message;

  return (
    <section className="rescue-limit-card pixel-inset w-full rounded-none border border-border/80 bg-muted/35 p-3 transition-colors focus-within:border-primary/70 lg:py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <label htmlFor="limit-price-input">Limit price</label>
          <InfoTooltip
            text={
              view === "price"
                ? TOOLTIP_DESCRIPTIONS.LIMIT_PRICE_INPUT
                : TOOLTIP_DESCRIPTIONS.LIMIT_SLIPPAGE_INPUT
            }
            side="right"
          />
        </span>
        <div
          role="group"
          aria-label="Limit input mode"
          className="flex shrink-0 border border-border/60 p-px normal-case tracking-normal"
        >
          {(["price", "slippage"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`min-h-0 px-1 py-0.5 text-[11px] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${view === mode ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
            >
              {mode === "price" ? "Price" : "Slippage"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
        <Input
          id="limit-price-input"
          aria-label={
            view === "price" ? "Limit price" : "Slippage tolerance (%)"
          }
          aria-invalid={Boolean(error)}
          aria-describedby={pair ? "limit-price-hint" : undefined}
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            if (!isDecimalInput(next)) return;
            onManualEdit();
            clearErrors(["limitPrice", "slippagePercent"]);
            setValue("limitPriceSource", view, { shouldDirty: true });
            setValue(
              view === "price" ? "limitPrice" : "slippagePercent",
              next,
              {
                shouldDirty: true,
                shouldValidate: true,
              },
            );
          }}
          className="h-11 w-full min-w-0 rounded-none border-none bg-transparent px-0 text-left text-[28px] font-medium tracking-tight tabular-nums shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring sm:text-[28px]"
        />
        <span
          aria-hidden="true"
          className="shrink-0 text-sm text-muted-foreground"
        >
          {view === "price" ? pair : "%"}
        </span>
      </div>
      <div className="flex h-5 min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
        {pair && (
          <>
            <button
              id="limit-price-hint"
              type="button"
              onClick={() => setView(view === "price" ? "slippage" : "price")}
              aria-label={
                view === "price" ? "Switch to Slippage" : "Switch to Price"
              }
              className="h-5 min-h-0 min-w-0 truncate text-left text-xs underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:text-[11px]"
            >
              {view === "price"
                ? `Slippage: ${slippage ? `${formatInputAmount(slippage)}%` : "--"}`
                : `Limit ≈ ${limitPrice ? `${formatTokenAmount(limitPrice)} ${pair}` : "--"}`}
            </button>
            {defaultSlippage ? (
              <span className="flex h-5 shrink-0 items-center text-[11px]">
                Default
              </span>
            ) : (
              <div className="flex h-5 shrink-0 items-center gap-2">
                <span className="text-[11px]">Custom</span>
                <button
                  type="button"
                  onClick={onResetToDefault}
                  className="h-5 min-h-0 shrink-0 text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Reset to default
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
