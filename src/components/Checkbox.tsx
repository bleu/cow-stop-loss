import { Checkbox as CheckboxPrimitive } from "@bleu/ui";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { InfoTooltip } from "./Tooltip";

interface ICheckbox {
  name: string;
  label?: string;
  tooltipText?: string;
  tooltipLink?: string;
  disabled?: boolean;
}

export function Checkbox({
  name,
  label,
  tooltipLink,
  tooltipText,
  disabled,
}: ICheckbox) {
  const id = `checkbox-${name}`;
  const { setValue, control, register } = useFormContext();
  register(name);
  const value = useWatch({ control, name });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <CheckboxPrimitive
          checked={value}
          onClick={() => setValue(name, !value)}
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
