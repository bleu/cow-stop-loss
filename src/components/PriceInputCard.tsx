import { Card, CardContent, CardTitle } from "@bleu/ui";
import { useForm } from "react-hook-form";

import { Input } from "./Input";

export function PriceInputCard({
  title,
  fieldName,
  form,
  showMarketPrice = false,
}: {
  title: string;
  fieldName: string;
  form: ReturnType<typeof useForm>;
  showMarketPrice?: boolean;
}) {
  const { register } = form;
  return (
    <Card className="bg-background text-foreground w-full p-2 rounded-none">
      <CardTitle>
        <div className="flex justify-between text-base">
          <span>{title}</span>
          <button className="text-accent text-sm hover:text-accent/80">
            Set to market
          </button>
        </div>
      </CardTitle>
      <CardContent className="flex flex-col gap-2 px-0 py-2 items-start">
        <div className="flex justify-between">
          <Input
            {...register(fieldName)}
            type="number"
            step={1 / 10 ** 18}
            placeholder="0.0"
            className="text-2xl"
          />
          <span className="w-1/5">BBB</span>
        </div>
        {showMarketPrice && (
          <div className="flex flex-col items-start justify-between text-xs text-foreground/70">
            <span>Market price AAA = 1000 BBB</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
