"use client";

import { cn, FormControl, FormLabel, FormMessage } from "@bleu/ui";
import React, { HTMLProps } from "react";
import { FieldError, RegisterOptions, useFormContext } from "react-hook-form";

import { InfoTooltip } from "./Tooltip";

interface IInput extends Omit<HTMLProps<HTMLInputElement>, "name"> {
  name: string;
  validation?: RegisterOptions;
  tooltipText?: string;
  tooltipLink?: string;
}

export const BaseInput = React.forwardRef<
  HTMLInputElement,
  HTMLProps<HTMLInputElement>
>((props, ref) => (
  <input
    {...props}
    ref={ref}
    className={cn(
      "w-full selection:color-white border border-border box-border inline-flex h-[35px] appearance-none items-center justify-center bg-input px-[10px] text-[15px] leading-none text-background outline-none selection:bg-primary-content disabled:bg-background/50 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 rounded-md",
      props.className
    )}
  />
));

export const Input = React.forwardRef<HTMLInputElement, IInput>(
  ({ name, label, validation, tooltipText, tooltipLink, ...props }: IInput) => {
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
      <div className="flex flex-col">
        <div className="flex flex-row justify-between">
          <FormLabel className="mb-2 block text-sm">{label}</FormLabel>
          <InfoTooltip text={tooltipText} link={tooltipLink} />
        </div>
        <FormControl>
          <BaseInput
            {...props}
            {...register(name, validation)}
            className={cn({ "border border-destructive": errors[name] })}
          />
        </FormControl>
        {errorMessage && (
          <FormMessage className="mt-1 h-6 text-sm text-destructive">
            <span>{errorMessage}</span>
          </FormMessage>
        )}
      </div>
    );
  }
);
