import { Checkbox as CheckboxPrimitive } from "@bleu/ui";
import React from "react";

import { InfoTooltip } from "./Tooltip";

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
          checked={checked}
          onClick={() => onChange()}
          disabled={disabled}
          id={id}
        />
        {label && (
          <label htmlFor={id} className="pl-[15px] text-[15px] leading-8">
            {label}
          </label>
        )}
      </div>
      <InfoTooltip text={tooltipText} link={tooltipLink} />
    </div>
  );
}
