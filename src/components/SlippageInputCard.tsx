import { Card, CardContent, CardTitle, Input } from "@bleu/ui";
import { useFormContext } from "react-hook-form";

import { slippagePercentSchema } from "#/lib/calculateAmounts";
import type { SwapData } from "#/lib/types";

import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export function SlippageInputCard() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SwapData>();
  const slippage = watch("slippagePercent");
  const presets = ["0.1", "0.5", "1"];
  const selectedPreset = slippagePercentSchema.safeParse(slippage).success
    ? presets.find((value) => Number(value) === Number(slippage)) || ""
    : "";

  return (
    <Card className="bg-background w-full p-2 rounded-lg">
      <CardTitle className="font-normal text-xs">
        <label htmlFor="slippage-percent">Slippage</label>
      </CardTitle>
      <CardContent className="px-0 pt-2 pb-0 flex items-center gap-1">
        <ToggleGroup
          type="single"
          value={selectedPreset}
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
            <ToggleGroupItem key={value} value={value}>
              {value}%
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Input
          {...register("slippagePercent")}
          id="slippage-percent"
          type="text"
          inputMode="decimal"
          className="min-w-0 w-full h-9 bg-background"
        />
        <span>%</span>
      </CardContent>
      {errors.slippagePercent?.message && (
        <p role="alert" className="text-xs text-destructive">
          {errors.slippagePercent.message}
        </p>
      )}
    </Card>
  );
}
