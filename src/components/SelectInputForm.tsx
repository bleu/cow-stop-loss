import { FormLabel, Select } from "@bleu-fi/ui";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import React from "react";

import { Tooltip } from "./Tooltip";

const SelectInputForm = ({
  label,
  name,
  options,
  onValueChange,
  placeholder,
  tooltipText,
}: {
  label?: string;
  name: string;
  options: { id: number | string; value: string }[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  tooltipText?: string;
}) => (
  <div className="flex w-full flex-col justify-start">
    <label className="block text-sm text-primary-foreground" htmlFor={name}>
      <div className="flex flex-row justify-between">
        <FormLabel className="mb-2 block text-sm">{label}</FormLabel>
        {tooltipText && (
          <Tooltip content={tooltipText}>
            <InfoCircledIcon />
          </Tooltip>
        )}
      </div>{" "}
      <Select.SelectRoot onValueChange={onValueChange} name={name}>
        <Select.SelectTrigger className="h-[35px] inline-flex w-full items-center gap-[5px] bg-input border border-background">
          <Select.SelectValue placeholder={placeholder} />
        </Select.SelectTrigger>
        <Select.SelectContent className="z-[10000] w-full overflow-hidden bg-input text-primary-foreground">
          <Select.SelectGroup>
            <Select.SelectLabel className="pl-4" />
            {options.map((option) => (
              <Select.SelectItem key={option.id} value={option.id.toString()}>
                {option.value}
              </Select.SelectItem>
            ))}
          </Select.SelectGroup>
        </Select.SelectContent>
      </Select.SelectRoot>
    </label>
  </div>
);

export { SelectInputForm };
