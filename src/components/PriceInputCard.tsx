import { Button, Card, CardContent, CardTitle, Input } from "@bleu/ui";
import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { SwapData } from "#/lib/types";

import { InfoTooltip } from "./ui/tooltip";

export const PriceInputCard = memo(PriceInputCardComponent);

function PriceInputCardComponent({ disabled }: { disabled?: boolean }) {
  const { register, control, setValue } = useFormContext<SwapData>();
  const [tokenBuy, tokenSell] = useWatch({
    control,
    name: ["tokenBuy", "tokenSell"],
  });
  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  return (
    <Card className="bg-background w-full p-2 rounded-lg">
      <CardTitle className="flex gap-1 font-normal text-xs">
        <label htmlFor="trigger-price">Trigger price</label>
        <InfoTooltip text={TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE} side="right" />
      </CardTitle>
      <CardContent className="flex flex-col gap-1 px-0 pt-2 pb-0 items-start">
        <Input
          {...register("strikePrice")}
          id="trigger-price"
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder="0.0"
          className="w-full border-none shadow-none h-9 focus-visible:ring-transparent px-0 text-lg"
        />
        {tokenBuy && tokenSell && (
          <span className="text-xs">
            {tokenBuy.symbol} per {tokenSell.symbol}
          </span>
        )}
        {marketPrice && (
          <Button
            type="button"
            variant="ghost"
            className="py-0 -ml-1 px-1 h-fit text-accent text-xs"
            onClick={() =>
              setValue(
                "strikePrice",
                marketPrice.toFixed(18).replace(/\.?0+$/, ""),
                { shouldValidate: true, shouldDirty: true },
              )
            }
          >
            Set to market
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
