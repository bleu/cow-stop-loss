import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { SwapData } from "#/lib/types";

export function OrderTypeToggleGroup({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState("sell");

  useEffect(() => {
    onChange(value);
  }, [value]);

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      onValueChange={(value) => {
        if (value) setValue(value);
      }}
    >
      <ToggleGroupItem
        className="text-base font-bold h-min data-[state=on]:underline data-[state=on]:decoration-primary data-[state=on]:decoration-2 data-[state=on]:bg-transparent data-[state=on]:text-foreground hover:underline hover:decoration-primary hover:decoration-2 hover:bg-transparent hover:text-foreground px-0 opacity-50 data-[state=on]:opacity-100 hover:opacity-100"
        value="buy"
        aria-label="Toggle buy"
      >
        buy
      </ToggleGroupItem>
      <ToggleGroupItem
        className="text-base font-bold h-min data-[state=on]:underline data-[state=on]:decoration-primary data-[state=on]:decoration-2 data-[state=on]:bg-transparent data-[state=on]:text-foreground hover:underline hover:decoration-primary hover:decoration-2 hover:bg-transparent hover:text-foreground px-0 opacity-50 data-[state=on]:opacity-100 hover:opacity-100"
        value="sell"
        aria-label="Toggle sell"
      >
        sell
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export function OrderTypeSwitch() {
  const { setValue } = useFormContext<SwapData>();

  return (
    <div className="flex gap-2 items-center">
      <span className="text-base font-bold inline-flex items-center space-x-1">
        <span>Create</span>
        <OrderTypeToggleGroup
          onChange={(value) => {
            setValue("isSellOrder", value === "sell");
          }}
        />
        <span>order</span>
      </span>
    </div>
  );
}
