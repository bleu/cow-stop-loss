"use client";

import { Controller, useFormContext } from "react-hook-form";

import { VALID_TO_OPTIONS } from "#/lib/schema";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { SwapData } from "#/lib/types";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { InfoTooltip } from "../ui/tooltip";

export function ValidToInput() {
  const { control } = useFormContext<SwapData>();

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0">Expires</span>
      <InfoTooltip text={TOOLTIP_DESCRIPTIONS.VALID_TO_INPUT} side="right" />
      <Controller
        control={control}
        name="validTo"
        defaultValue={VALID_TO_OPTIONS.MONTHS_6}
        render={({ field: { onChange, value } }) => (
          <Select onValueChange={onChange} defaultValue={value} name="validTo">
            <SelectTrigger className="h-8 w-auto min-w-0 border-0 bg-transparent px-1 text-sm text-foreground shadow-none hover:bg-muted/40 focus:ring-0">
              <SelectValue placeholder="Select order expiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.keys(VALID_TO_OPTIONS).map((key) => (
                  <SelectItem
                    key={key}
                    value={
                      VALID_TO_OPTIONS[key as keyof typeof VALID_TO_OPTIONS]
                    }
                  >
                    {VALID_TO_OPTIONS[key as keyof typeof VALID_TO_OPTIONS]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
