import { Input } from "@bleu/ui";
import { useFormContext, useWatch } from "react-hook-form";

import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { isDecimalInput } from "#/utils/inputs";

import { InfoTooltip } from "./ui/tooltip";

export function SlippageInputCard({
  autoSlippage,
  onAutoSlippageChange,
}: {
  autoSlippage?: boolean;
  onAutoSlippageChange?: (automatic: boolean) => void;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<{ slippagePercent: string }>();
  const slippageInput = register("slippagePercent");
  const slippagePercent = useWatch({ control, name: "slippagePercent" });

  return (
    <div className="rescue-input-inline min-w-0">
      <div className="rescue-input-label flex items-center gap-1.5">
        <label htmlFor="slippage-percent" className="text-sm font-medium">
          Slippage (%)
        </label>
        <InfoTooltip text={TOOLTIP_DESCRIPTIONS.MAX_SLIPPAGE} />
      </div>
      <div className="flex min-w-0 items-center gap-2">
        {onAutoSlippageChange && (
          <button
            type="button"
            aria-label="Default slippage"
            aria-pressed={autoSlippage}
            onClick={() => onAutoSlippageChange(!autoSlippage)}
            className="pixel-control min-h-11 px-3 text-sm aria-pressed:text-primary"
          >
            Default
          </button>
        )}
        <Input
          {...slippageInput}
          value={slippagePercent ?? ""}
          onChange={(event) => {
            if (!isDecimalInput(event.target.value)) return;
            onAutoSlippageChange?.(false);
            void slippageInput.onChange(event);
          }}
          id="slippage-percent"
          type="text"
          inputMode="decimal"
          className="min-h-11 h-11 min-w-0 w-full rounded-none bg-card text-sm tabular-nums"
        />
      </div>
      {errors.slippagePercent?.message && (
        <p role="alert" className="rescue-input-error text-xs text-destructive">
          {errors.slippagePercent.message}
        </p>
      )}
    </div>
  );
}
