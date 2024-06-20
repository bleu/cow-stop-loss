import { cn, Input as InputPrimitive, InputProps } from "@bleu/ui";

export function Input({
  className,
  ...props
}: InputProps & React.RefAttributes<HTMLInputElement>) {
  return (
    <InputPrimitive
      {...props}
      className={cn(
        "w-full border-none shadow-none h-9 focus-visible:ring-transparent placeholder:text-foreground/70 px-0",
        className
      )}
    />
  );
}
