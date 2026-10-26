"use client";

import { Button } from "@bleu/ui";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

import type { OrderSizeLimitStatus } from "#/hooks/useOrderSizeLimit";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { ORDER_SIZE_LIMIT_LABEL } from "#/lib/orderSizeLimit";
import { SwapData } from "#/lib/types";

export function SwapCardSubmitButton({
  disabled: reviewDisabled = false,
  orderSizeLimit,
}: {
  disabled?: boolean;
  orderSizeLimit: OrderSizeLimitStatus;
}) {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
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

    if (orderSizeLimit !== "allowed") {
      return {
        disabled: true,
        text:
          orderSizeLimit === "over"
            ? `Order exceeds ${ORDER_SIZE_LIMIT_LABEL} limit`
            : orderSizeLimit === "checking"
              ? "Checking order size..."
              : "USD price unavailable",
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
    orderSizeLimit,
    slippagePercent,
    marketPrice,
    sellAmount,
    strikePrice,
    tokenBuy,
    tokenSell,
    tokenSellBalance,
  ]);

  const { disabled, text } = getButtonState();

  if (!address) {
    return (
      <Button
        className="pixel-control min-h-12 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2 h-auto min-h-12 w-full rounded-none bg-primary py-3 font-semibold tracking-tight text-primary-foreground shadow-[0_10px_30px_-16px_hsl(var(--primary)/0.55)] transition-colors hover:bg-primary/90 "
        type="button"
        onClick={openConnectModal}
      >
        Connect wallet to place order
      </Button>
    );
  }

  return (
    <Button
      className="pixel-control min-h-12 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2 h-auto min-h-12 rounded-none py-3 font-semibold tracking-tight shadow-[0_10px_30px_-16px_hsl(var(--primary)/0.8)] transition-transform "
      type="submit"
      loading={isSubmitting}
      loadingText="Validating..."
      disabled={reviewDisabled || disabled || isSubmitting}
    >
      {text}
    </Button>
  );
}
