import { Button, Separator } from "@bleu/ui";
import { UpdateIcon } from "@radix-ui/react-icons";
import { memo } from "react";
import { useFormContext } from "react-hook-form";

import { useSwapCardContext } from "#/contexts/swapCardContext";
import { SwapData } from "#/lib/types";

export const InvertTokensSeparator = memo(InvertTokensSeparatorComponent);

function InvertTokensSeparatorComponent() {
  const { getValues, setValue } = useFormContext<SwapData>();
  const { updateOracle } = useSwapCardContext();

  function invertTokens() {
    const [
      tokenBuy,
      tokenSell,
      amountBuy,
      amountSell,
      limitPrice,
      strikePrice,
    ] = getValues([
      "tokenBuy",
      "tokenSell",
      "amountBuy",
      "amountSell",
      "limitPrice",
      "strikePrice",
    ]);
    setValue("tokenBuy", tokenSell);
    setValue("tokenSell", tokenBuy);
    setValue("amountBuy", amountSell);
    setValue("amountSell", amountBuy);
    if (limitPrice) setValue("limitPrice", 1 / limitPrice);
    if (strikePrice) setValue("strikePrice", 1 / strikePrice);
    updateOracle({ tokenSell: tokenBuy, tokenBuy: tokenSell });
  }

  return (
    <div className="flex w-full gap-1 items-center">
      <div className="w-2/5">
        <Separator />
      </div>
      <Button
        className="flex justify-center w-1/5 hover:text-primary/70"
        type="button"
        variant="link"
        onClick={invertTokens}
      >
        <UpdateIcon className="size-6" />
      </Button>
      <div className="w-2/5">
        <Separator />
      </div>
    </div>
  );
}
