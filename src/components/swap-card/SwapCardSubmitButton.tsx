"use client";

import { Button } from "@bleu/ui";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { parseUnits } from "viem";

import { useDraftOrders } from "#/hooks/useDraftOrders";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { SwapData } from "#/lib/types";

export function SwapCardSubmitButton() {
  const { draftOrders } = useDraftOrders();
  const {
    formState: { isSubmitting, errors },
    control,
  } = useFormContext<SwapData>();

  const tokenSellBalance = useSwapTokenBalances(
    (state) => state.tokenSellBalance,
  );

  const [
    tokenBuy,
    tokenSell,
    buyAmount,
    sellAmount,
    strikePrice,
    slippagePercent,
    isSellOrder,
  ] = useWatch({
    control,
    name: [
      "tokenBuy",
      "tokenSell",
      "amountBuy",
      "amountSell",
      "strikePrice",
      "slippagePercent",
      "isSellOrder",
    ],
  });

  const { data: marketPrice } = useTokenPairPrice(tokenSell, tokenBuy);

  const getButtonState = useCallback(() => {
    if (draftOrders.length > 4) {
      return {
        disabled: true,
        text: "You can only have 5 draft orders at a time",
      };
    }
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
    if (!(isSellOrder ? sellAmount : buyAmount)) {
      return {
        disabled: true,
        text: "Enter amounts",
      };
    }
    if (!strikePrice) return { disabled: true, text: "Set the trigger price" };
    let requiredSell: string;
    try {
      requiredSell = calculateAmounts({
        isSellOrder,
        amount: isSellOrder ? sellAmount : buyAmount,
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

    if (
      marketPrice &&
      parseUnits(strikePrice, 18) > parseUnits(marketPrice.toFixed(18), 18)
    ) {
      return {
        disabled: true,
        text: "Trigger price must be at or below market price",
      };
    }

    if (!marketPrice) {
      return {
        disabled: true,
        text: "Error quoting tokens, make sure that CoW supports them.",
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
    buyAmount,
    draftOrders.length,
    errors,
    slippagePercent,
    isSellOrder,
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
      disabled={disabled || isSubmitting}
    >
      {text}
    </Button>
  );
}
