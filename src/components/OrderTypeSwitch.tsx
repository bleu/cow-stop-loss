import { Switch } from "@bleu/ui";
import { useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";

import { generateSwapSchema } from "#/lib/schema";

export function OrderTypeSwitch() {
  const { control, setValue } =
    useFormContext<z.input<ReturnType<typeof generateSwapSchema>>>();
  const isSellOrder = useWatch({
    control,
    name: "isSellOrder",
    defaultValue: true,
  });
  return (
    <div className="flex gap-2 items-center">
      <span className="text-base font-bold">
        Create a new {isSellOrder ? "sell order" : "buy order"}
      </span>
      <Switch
        onClick={() => {
          setValue("isSellOrder", !isSellOrder);
        }}
        className="shadow-none data-[state=unchecked]:bg-primary"
      />
    </div>
  );
}
