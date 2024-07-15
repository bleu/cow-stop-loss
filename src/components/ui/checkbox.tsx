import { Checkbox as CheckboxPrimitive } from "@bleu/ui";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { InfoTooltip } from "./tooltip";

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
    <div className="flex items-center gap-1">
      <CheckboxPrimitive
        checked={value}
        onClick={() => setValue(name, !value)}
        disabled={disabled}
        id={id}
      />
      {label && (
        <label htmlFor={id} className="font-semibold text-sm">
          {label}
        </label>
      )}
      <InfoTooltip text={tooltipText} link={tooltipLink} />
    </div>
  );
}
