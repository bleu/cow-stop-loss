import { cn, Input as InputPrimitive, Label } from "@bleu/ui";
import React, { HTMLProps } from "react";
import { FieldError, RegisterOptions, useFormContext } from "react-hook-form";

import { InfoTooltip } from "./tooltip";

interface IInput extends Omit<HTMLProps<HTMLInputElement>, "name"> {
  name: string;
  validation?: RegisterOptions;
  tooltipText?: string;
  tooltipLink?: string;
  extraLabelElement?: React.ReactNode;
  layout?: "stacked" | "inline";
}

export function Input({
  name,
  label,
  validation,
  tooltipText,
  tooltipLink,
  extraLabelElement,
  className,
  id = name,
  layout = "stacked",
  ...props
}: IInput) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  if (!name) {
    throw new Error("Input component requires a name prop");
  }

  const error = errors[name] as FieldError | undefined;
  const errorMessage = error?.message;

  return (
    <div
      className={layout === "inline" ? "rescue-input-inline" : "flex flex-col"}
    >
      {label && (
        <div className="rescue-input-label flex flex-row gap-x-1.5 items-center mb-2">
          <Label htmlFor={id} className="block text-sm">
            {label}
          </Label>
          {tooltipText && <InfoTooltip text={tooltipText} link={tooltipLink} />}
          {extraLabelElement}
        </div>
      )}
      <InputPrimitive
        {...props}
        {...register(name, validation)}
        id={id}
        className={cn(
          "w-full shadow-none rounded-none bg-card placeholder:opacity-50 border border-border focus-visible:border-primary/60",
          className,
        )}
      />

      {errorMessage && (
        <div className="rescue-input-error mt-1 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
