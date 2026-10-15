import { Input } from "@bleu/ui";
import { useFormContext } from "react-hook-form";

import { slippagePercentSchema } from "#/lib/calculateAmounts";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";

import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { InfoTooltip } from "./ui/tooltip";

export function SlippageInputCard() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<{ slippagePercent: string }>();
  const slippage = watch("slippagePercent");
  const presets = ["0.1", "0.5", "1"];
  const selectedPreset = slippagePercentSchema.safeParse(slippage).success
    ? presets.find((value) => Number(value) === Number(slippage)) || ""
    : "";

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="slippage-percent"
          className="text-[13px] font-medium text-muted-foreground"
        >
          Max slippage
        </label>
        <InfoTooltip text={TOOLTIP_DESCRIPTIONS.MAX_SLIPPAGE} />
      </div>
      <div className="mt-1.5 flex min-w-0 items-center gap-2">
        <ToggleGroup
          type="single"
          value={selectedPreset}
          className="h-10 shrink-0"
          onValueChange={(value) => {
            if (value)
              setValue("slippagePercent", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
          }}
          aria-label="Slippage presets"
        >
          {presets.map((value) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="px-2 text-[13px] sm:px-2.5"
            >
              {value}%
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Input
          {...register("slippagePercent")}
          id="slippage-percent"
          type="text"
          inputMode="decimal"
          className="h-11 min-w-0 w-20 rounded-xl bg-background text-center text-sm tabular-nums"
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
