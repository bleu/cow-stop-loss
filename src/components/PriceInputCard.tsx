import { Card, CardContent, CardTitle, Input } from "@bleu/ui";
import { memo, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { calculateAmounts } from "#/lib/calculateAmounts";
import { SwapData } from "#/lib/types";

import { InfoTooltip } from "./Tooltip";

export const PriceInputCard = memo(PriceInputCardComponent);

function PriceInputCardComponent({
  fieldName,
}: {
  fieldName: "limitPrice" | "strikePrice";
  showMarketPrice?: boolean;
}) {
  const { register, control, getValues, setValue } = useFormContext<SwapData>();
  const title = fieldName === "limitPrice" ? "Limit price" : "Trigger price";

  const [tokenBuy, price, marketPrice] = useWatch({
    control,
    name: ["tokenBuy", fieldName, "marketPrice"],
  });

  async function updateDisabledAmount() {
    const isSellOrder = getValues("isSellOrder");
    const referenceAmount = getValues(isSellOrder ? "amountSell" : "amountBuy");
    if (!referenceAmount) return;
    const [sellAmount, buyAmount] = calculateAmounts({
      isSellOrder,
      amount: referenceAmount,
      limitPrice: price,
    });
    setValue(
      isSellOrder ? "amountBuy" : "amountSell",
      isSellOrder ? buyAmount : sellAmount
    );
  }

  useEffect(() => {
    if (fieldName === "limitPrice") {
      updateDisabledAmount();
    }
  }, [price]);

  const tooltipText =
    fieldName === "limitPrice"
      ? "The maximum price you are willing to pay."
      : "The price at which the order will be posted.";

  return (
    <Card className="bg-background text-foreground w-full p-2 rounded-md">
      <CardTitle>
        <div className="flex justify-between font-normal text-xs">
          <div className="flex gap-1">
            <span>{title}</span>
            <InfoTooltip text={tooltipText} />
          </div>
          {marketPrice && (
            <button
              className="text-accent hover:text-accent/80"
              type="button"
              onClick={() => {
                setValue(fieldName, Number(marketPrice.toFixed(4)));
              }}
            >
              Market
            </button>
          )}
        </div>
      </CardTitle>
      <CardContent className="flex flex-col gap-2 px-0 py-2 items-start">
        <div className="flex justify-between items-center gap-5">
          <Input
            {...register(fieldName)}
            type="number"
            step={1 / 10 ** 18}
            placeholder="0.0"
            className="w-full border-none shadow-none h-9 focus-visible:ring-transparent placeholder:text-foreground/70 px-0 text-2xl"
            min={0}
          />
          {tokenBuy && tokenBuy && <span>{tokenBuy.symbol}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
