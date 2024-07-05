import { Button, Card, CardContent, CardTitle, Input } from "@bleu/ui";
import { memo, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { calculateAmounts } from "#/lib/calculateAmounts";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
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
      isSellOrder ? buyAmount : sellAmount,
    );
  }

  useEffect(() => {
    if (fieldName === "limitPrice") {
      updateDisabledAmount();
    }
  }, [price]);

  const tooltipText =
    fieldName === "limitPrice"
      ? TOOLTIP_DESCRIPTIONS.LIMIT_PRICE
      : TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE;

  return (
    <Card className="bg-background  w-full p-2 rounded-lg">
      <CardTitle>
        <div className="flex justify-between font-normal text-xs">
          <div className="flex gap-1">
            <span>{title}</span>
            <InfoTooltip text={tooltipText} />
          </div>
          {marketPrice && (
            <Button
              type="button"
              variant="ghost"
              className="py-0 px-1 h-fit text-accent"
              onClick={() => {
                setValue(fieldName, Number(marketPrice.toFixed(4)));
              }}
            >
              Market
            </Button>
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
            className="w-full border-none shadow-none h-9 focus-visible:ring-transparent placeholder:/70 px-0 text-2xl"
            min={0}
          />
          {tokenBuy && tokenBuy && <span>{tokenBuy.symbol}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
