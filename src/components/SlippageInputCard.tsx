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
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="slippage-percent"
          className="text-[13px] font-medium text-muted-foreground"
        >
          Slippage
        </label>
        <InfoTooltip text={TOOLTIP_DESCRIPTIONS.MAX_SLIPPAGE} />
      </div>
      <div className="mt-1.5 flex min-w-0 items-center gap-2">
        <Input
          {...register("slippagePercent")}
          id="slippage-percent"
          type="text"
          inputMode="decimal"
          className="h-10 min-w-0 w-20 rounded-xl bg-background text-center text-sm tabular-nums"
        />
        <span className="text-[15px] text-muted-foreground">%</span>
      </div>
      {errors.slippagePercent?.message && (
        <p role="alert" className="text-xs text-destructive">
          {errors.slippagePercent.message}
        </p>
      )}
    </div>
  );
}
