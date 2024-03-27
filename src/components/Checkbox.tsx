import { Checkbox as CheckboxPrimitive } from "@bleu-fi/ui";
import { slateDarkA } from "@radix-ui/colors";
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
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  tooltipLink,
  tooltipText,
}: ICheckbox) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <CheckboxPrimitive
          checked={checked}
          onClick={() => onChange()}
          id={id}
          />
        {label && (
          <label htmlFor={id} className="pl-[15px] text-[15px] leading-8">
            {label}
          </label>
        )}
      </div>
      {tooltipText && (
        <Tooltip content={tooltipText}>
          {tooltipLink ? (
            <a href={tooltipLink} target="_blank">
              <InfoCircledIcon color={slateDarkA.slateA11} />
            </a>
          ) : (
            <InfoCircledIcon color={slateDarkA.slateA11} />
          )}
        </Tooltip>
      )}
    </div>
  );
}
