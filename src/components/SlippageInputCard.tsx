import { Input } from "@bleu/ui";
import { useFormContext } from "react-hook-form";

import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";

import { InfoTooltip } from "./ui/tooltip";

export function SlippageInputCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ slippagePercent: string }>();

  return (
    <div className="rescue-input-inline min-w-0">
      <div className="rescue-input-label flex items-center gap-1.5">
        <label htmlFor="slippage-percent" className="text-sm font-medium">
          Slippage (%)
        </label>
        <InfoTooltip text={TOOLTIP_DESCRIPTIONS.MAX_SLIPPAGE} />
      </div>
      <Input
        {...register("slippagePercent")}
        id="slippage-percent"
        type="text"
        inputMode="decimal"
        className="min-h-11 h-11 min-w-0 w-full rounded-none bg-card text-sm tabular-nums"
      />
      {errors.slippagePercent?.message && (
        <p role="alert" className="rescue-input-error text-xs text-destructive">
          {errors.slippagePercent.message}
        </p>
      )}
    </div>
  );
}
