"use client";

import { Button } from "@bleu/ui";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useAdvancedSettingsStore } from "#/hooks/useAdvancedSettings";
import { useDraftOrders } from "#/hooks/useDraftOrders";
import { useOracleStore } from "#/hooks/useOracle";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { SwapData } from "#/lib/types";

export function SwapCardSubmitButton() {
  const { draftOrders } = useDraftOrders();
  const {
    formState: { isSubmitting, errors },
    control,
  } = useFormContext<SwapData>();
  const isLoading = useOracleStore((state) => state.isLoading);

  const tokenSellBalance = useSwapTokenBalances(
    (state) => state.tokenSellBalance,
  );
  const advancedSettings = useAdvancedSettingsStore(
    (state) => state.advancedSettings,
  );
  const [tokenBuyOracle, tokenSellOracle] = useOracleStore((state) => [
    state.oracleRoute?.tokenBuyOracle,
    state.oracleRoute?.tokenSellOracle,
  ]);

  const [tokenBuy, tokenSell, buyAmount, sellAmount, strikePrice, limitPrice] =
    useWatch({
      control,
      name: [
        "tokenBuy",
        "tokenSell",
        "amountBuy",
        "amountSell",
        "strikePrice",
        "limitPrice",
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
    if (!buyAmount && !sellAmount) {
      return {
        disabled: true,
        text: "Enter amounts",
      };
    }
    if (sellAmount > Number(tokenSellBalance)) {
      return {
        disabled: true,
        text: "Insufficient balance",
      };
    }
    if (!limitPrice) {
      return {
        disabled: true,
        text: "Set the limit price",
      };
    }
    if (!strikePrice) {
      return {
        disabled: true,
        text: "Set the trigger price",
      };
    }

    if (marketPrice && strikePrice > marketPrice) {
      return {
        disabled: true,
        text: "Trigger price must be lower than market price",
      };
    }

    if (
      (!tokenBuyOracle && !advancedSettings.tokenBuyOracle) ||
      (!tokenSellOracle && !advancedSettings.tokenSellOracle)
    ) {
      return {
        disabled: true,
        text: "Error finding token oracles, set it manually in advanced settings",
      };
    }

    if (!marketPrice) {
      return {
        disabled: true,
        text: "Error quoting tokens, make sure that CoW supports them.",
      };
    }
    if (Object.values(errors).length) {
      const errorList = Object.values(errors);
      // const firstErrorMessage = errorList[0];
      // const firstErrorKey = Object.keys(errors).find(
      //   // @ts-ignore
      //   (key) => errors[key] === firstErrorMessage,
      // );
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
    advancedSettings.tokenBuyOracle,
    advancedSettings.tokenSellOracle,
    buyAmount,
    draftOrders.length,
    errors,
    limitPrice,
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
      loading={isSubmitting || isLoading}
      loadingText={isSubmitting ? "Validating..." : "Loading..."}
      disabled={disabled}
    >
      {text}
    </Button>
  );
}
