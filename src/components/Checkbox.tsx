import { Checkbox as CheckboxPrimitive } from "@bleu-fi/ui";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import React from "react";

import { Tooltip } from "./Tooltip";

interface ICheckbox {
  id: string;
  checked: boolean;
  onChange: () => void;
  label?: string;
  tooltipText?: string;
  tooltipLink?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  tooltipLink,
  tooltipText,
  disabled,
}: ICheckbox) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <CheckboxPrimitive
          className="flex size-[15px] appearance-none items-center justify-center bg-white outline-none border-primary-foreground"
          checked={checked}
          onClick={() => onChange()}
          id={id}
          disabled={disabled}
        />
        <label htmlFor={id} className="pl-[15px] text-[15px] leading-8">
          {label}
        </label>
      </div>
      {tooltipText && (
        <Tooltip content={tooltipText}>
          {tooltipLink ? (
            <a href={tooltipLink} target="_blank">
              <InfoCircledIcon />
            </a>
          ) : (
            <InfoCircledIcon />
          )}
        </Tooltip>
      )}
    </div>
  );
}
