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
    <div className="rescue-input-inline min-w-0">
      <div className="rescue-input-label flex items-center gap-1.5">
        <label htmlFor="order-expiry" className="text-sm font-medium">
          Expires
        </label>
        <InfoTooltip text={TOOLTIP_DESCRIPTIONS.VALID_TO_INPUT} side="right" />
      </div>
      <Controller
        control={control}
        name="validTo"
        render={({ field: { onChange, value } }) => (
          <Select onValueChange={onChange} value={value} name="validTo">
            <SelectTrigger
              id="order-expiry"
              className="pixel-control min-h-11 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 w-full border-border bg-card text-sm text-foreground"
            >
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
