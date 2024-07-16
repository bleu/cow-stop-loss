import { Button, Card, CardContent, CardTitle, Input } from "@bleu/ui";
import { ArrowLeftRight } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { SwapData } from "#/lib/types";
import { pasteAbsoluteValue, preventNegativeKeyDown } from "#/utils/inputs";

import { InfoTooltip } from "./ui/tooltip";

export const PriceInputCard = memo(PriceInputCardComponent);

function PriceInputCardComponent({
  fieldName,
  disabled,
}: {
  fieldName: "limitPrice" | "strikePrice";
  showMarketPrice?: boolean;
  disabled?: boolean;
}) {
  const { register, control, getValues, setValue } = useFormContext<SwapData>();
  const title = fieldName === "limitPrice" ? "Limit price" : "Trigger price";

  const [tokenBuy, tokenSell, formPrice] = useWatch({
    control,
    name: ["tokenBuy", "tokenSell", fieldName],
  });

  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  const [isInverted, setIsInverted] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<number | undefined>(
    formPrice,
  );

  useEffect(() => {
    updateDisplayPrice(formPrice);
  }, [formPrice, isInverted]);

  async function updateDisabledAmount() {
    const isSellOrder = getValues("isSellOrder");
    const referenceAmount = getValues(isSellOrder ? "amountSell" : "amountBuy");
    if (!referenceAmount) return;
    const [sellAmount, buyAmount] = calculateAmounts({
      isSellOrder,
      amount: referenceAmount,
      limitPrice: formPrice,
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
  }, [formPrice]);

  const tooltipText =
    fieldName === "limitPrice"
      ? TOOLTIP_DESCRIPTIONS.LIMIT_PRICE
      : TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE;

  const handleInvert = () => {
    setIsInverted(!isInverted);
    updateDisplayPrice(formPrice);
  };

  const updateDisplayPrice = (price: number | undefined) => {
    if (price !== undefined && price !== 0) {
      setDisplayPrice(isInverted ? 1 / price : price);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value);

    if (!isNaN(inputValue) && inputValue !== 0) {
      const newFormPrice = isInverted ? 1 / inputValue : inputValue;
      setValue(fieldName, newFormPrice);
      setDisplayPrice(inputValue);
    } else {
      setValue(fieldName, 0);
      setDisplayPrice(undefined);
    }
  };

  return (
    <Card className="bg-background w-full p-2 rounded-lg">
      <CardTitle>
        <div className="flex justify-between font-normal text-xs">
          <div className="flex gap-1">
            <span>{title}</span>
            <InfoTooltip text={tooltipText} />
          </div>
        </div>
      </CardTitle>
      <CardContent className="flex flex-col gap-1 px-0 pt-2 pb-0 items-start">
        <div className="flex justify-between items-center gap-2 w-full">
          <Input
            type="number"
            disabled={disabled}
            step={1 / 10 ** 18}
            placeholder="0.0"
            className="w-full border-none shadow-none h-9 focus-visible:ring-transparent px-0 text-lg"
            min={0}
            onKeyDown={preventNegativeKeyDown}
            onPaste={pasteAbsoluteValue}
            value={displayPrice !== undefined ? displayPrice : ""}
            onChange={handleInputChange}
          />
          <input type="hidden" {...register(fieldName)} />
          {tokenBuy && tokenSell && (
            <Button
              type="button"
              variant="ghost"
              className="py-0 px-1 h-fit text-accent text-xs text-end"
              onClick={handleInvert}
            >
              {isInverted ? tokenSell.symbol : tokenBuy.symbol}
              <ArrowLeftRight className="size-3" />
            </Button>
          )}
        </div>
        {marketPrice && (
          <Button
            type="button"
            variant="ghost"
            className="py-0 -ml-1 px-1 h-fit text-accent text-xs"
            onClick={() => {
              const newPrice = isInverted ? 1 / marketPrice : marketPrice;
              setValue(fieldName, Number(marketPrice.toFixed(4)));
              setDisplayPrice(newPrice);
            }}
          >
            Set to market
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
