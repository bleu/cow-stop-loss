import { cn, Input as InputPrimitive } from "@bleu/ui";
import React, { HTMLProps } from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  HTMLProps<HTMLInputElement>
>((props, ref) => (
  <InputPrimitive
    {...props}
    ref={ref}
    className={cn(
      "w-full border-none shadow-none h-9 focus-visible:ring-transparent placeholder:text-foreground/70 px-0",
      props.className
    )}
  />
));
