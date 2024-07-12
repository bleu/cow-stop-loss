"use client";

import { Button } from "@bleu/ui";
import { FieldErrors, useFormContext, useWatch } from "react-hook-form";
import { Address } from "viem";

import { useOrder } from "#/contexts/ordersContext";
import { useSwapCardContext } from "#/contexts/swapCardContext";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import {
  AdvancedSwapSettings,
  DraftOrder,
  IToken,
  SwapData,
} from "#/lib/types";

export function SwapCardSubmitButton() {
  const { draftOrders } = useOrder();
  const {
    formState: { isSubmitting, errors },
    control,
  } = useFormContext<SwapData>();
  const { tokenBuyOracle, tokenSellOracle, advancedSettings, isLoading } =
    useSwapCardContext();
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

  const { disabled, text } = getButtonState({
    draftOrders,
    tokenBuy,
    tokenSell,
    buyAmount,
    sellAmount,
    strikePrice,
    marketPrice,
    limitPrice,
    tokenSellOracle,
    tokenBuyOracle,
    advancedSettings,
    errors,
  });

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

function getButtonState({
  draftOrders,
  tokenBuy,
  tokenSell,
  buyAmount,
  sellAmount,
  strikePrice,
  marketPrice,
  limitPrice,
  tokenSellOracle,
  tokenBuyOracle,
  advancedSettings,
  errors,
}: {
  draftOrders: DraftOrder[];
  tokenBuy?: IToken;
  tokenSell?: IToken;
  buyAmount?: number;
  sellAmount?: number;
  strikePrice?: number;
  marketPrice?: number;
  limitPrice?: number;
  tokenSellOracle?: Address;
  tokenBuyOracle?: Address;
  advancedSettings: AdvancedSwapSettings;
  errors: FieldErrors<SwapData>;
}): {
  disabled: boolean;
  text: string;
} {
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
    const firstErrorMessage = errorList[0];
    const firstErrorKey = Object.keys(errors).find(
      // @ts-ignore
      (key) => errors[key] === firstErrorMessage
    );
    return {
      disabled: false,
      text: `Error on ${firstErrorKey}: ${firstErrorMessage}. Click to try again`,
    };
  }
  return {
    disabled: false,
    text: "Review Stop Loss order",
  };
}
