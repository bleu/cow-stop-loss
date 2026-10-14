"use client";

import { Button } from "@bleu/ui";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { parseUnits } from "viem";

import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { SwapData } from "#/lib/types";

export function SwapCardSubmitButton({
  disabled: reviewDisabled = false,
}: {
  disabled?: boolean;
}) {
  const {
    formState: { isSubmitting, errors },
    control,
  } = useFormContext<SwapData>();

  const tokenSellBalance = useSwapTokenBalances(
    (state) => state.tokenSellBalance,
  );

  const [tokenBuy, tokenSell, sellAmount, strikePrice, slippagePercent] =
    useWatch({
      control,
      name: [
        "tokenBuy",
        "tokenSell",
        "amountSell",
        "strikePrice",
        "slippagePercent",
      ],
    });

  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  const getButtonState = useCallback(() => {
    if (!tokenBuy || !tokenSell) {
      return {
        disabled: true,
        text: "Select tokens",
      };
    }
    if (tokenBuy.address.toLowerCase() === tokenSell.address.toLowerCase()) {
      return {
        disabled: true,
        text: "Tokens must be different",
      };
    }
    if (!sellAmount) {
      return {
        disabled: true,
        text: "Enter amounts",
      };
    }
    if (!strikePrice) return { disabled: true, text: "Set the trigger price" };
    let requiredSell: string;
    try {
      requiredSell = calculateAmounts({
        isSellOrder: true,
        amount: sellAmount,
        strikePrice,
        slippagePercent,
        sellDecimals: tokenSell.decimals,
        buyDecimals: tokenBuy.decimals,
      }).amountSell;
    } catch (error) {
      return {
        disabled: true,
        text: error instanceof Error ? error.message : "Invalid order amounts",
      };
    }
    if (tokenSellBalance === undefined) {
      return {
        disabled: true,
        text: "Sell token balance unavailable",
      };
    }
    if (
      parseUnits(requiredSell, tokenSell.decimals) >
      parseUnits(tokenSellBalance, tokenSell.decimals)
    ) {
      return {
        disabled: true,
        text: "Insufficient balance",
      };
    }

    if (!marketPrice || !Number.isFinite(marketPrice) || marketPrice <= 0) {
      return {
        disabled: true,
        text: "Market price unavailable. Try again.",
      };
    }
    if (parseUnits(strikePrice, 18) > parseUnits(marketPrice.toFixed(18), 18)) {
      return {
        disabled: true,
        text: "Trigger price must be at or below market price",
      };
    }

    const errorList = Object.entries(errors)
      .filter(([name]) => name !== "root")
      .map(([, error]) => error);
    if (errorList.length) {
      const errorString = errorList.map(({ message }) => message).join(", ");
      return {
        disabled: false,
        text: `${errorString}. Click to try again`,
      };
    }
    return {
      disabled: false,
      text: "Review Stop Loss order",
    };
  }, [
    errors,
    slippagePercent,
    marketPrice,
    sellAmount,
    strikePrice,
    tokenBuy,
    tokenSell,
    tokenSellBalance,
  ]);

  const { disabled, text } = getButtonState();

  return (
    <Button
      className="rounded-lg text-wrap py-2 mt-2 h-auto"
      type="submit"
      loading={isSubmitting}
      loadingText="Validating..."
      disabled={reviewDisabled || disabled || isSubmitting}
    >
      {text}
    </Button>
  );
}
