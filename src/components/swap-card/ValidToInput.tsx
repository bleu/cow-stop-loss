"use client";

import { Card, CardTitle } from "@bleu/ui";
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
    <Card className="flex flex-col gap-2 bg-background w-full p-2 rounded-lg">
      <CardTitle className="flex justify-between font-normal text-xs">
        <div className="flex gap-1">
          <span>Expiry</span>
          <InfoTooltip
            text={TOOLTIP_DESCRIPTIONS.VALID_TO_INPUT}
            side={"right"}
          />
        </div>
      </CardTitle>
      <Controller
        control={control}
        name="validTo"
        defaultValue={VALID_TO_OPTIONS.MONTHS_6}
        render={({ field: { onChange, value } }) => (
          <Select onValueChange={onChange} defaultValue={value} name="validTo">
            <SelectTrigger className="w-full">
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
    </Card>
  );
}
