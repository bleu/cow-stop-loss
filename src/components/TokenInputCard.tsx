import {
  Button,
  Card,
  CardContent,
  CardTitle,
  convertStringToNumberAndRoundDown,
  formatNumber,
  Input,
} from "@bleu/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { memo, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Address } from "viem";

import { useSwapCardContext } from "#/contexts/swapCardContext";
import { useTokens } from "#/contexts/tokensContext";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { ChainId } from "#/lib/publicClients";
import { fetchFormattedBalanceOf } from "#/lib/tokenUtils";
import { SwapData } from "#/lib/types";
import { pasteAbsoluteValue, preventNegativeKeyDown } from "#/utils/inputs";

import { TokenSelect } from "./TokenSelect";

function TokenInputCardComponent({ side }: { side: "Sell" | "Buy" }) {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();

  const {
    setValue,
    register,
    control,
    getValues,
    formState: { errors },
  } = useFormContext<SwapData>();
  const tokenFieldName = `token${side}` as const;
  const otherTokenFieldName =
    `token${side === "Buy" ? "Sell" : "Buy"}` as const;
  const amountFieldName = `amount${side}` as const;

  const [isAmountDisabled, setIsAmountDisabled] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>();
  const { useTokenPrice } = useTokens();

  const [token, isSellOrder, amount] = useWatch({
    control,
    name: [tokenFieldName, "isSellOrder", amountFieldName],
  });

  const { data: usdPrice } = useTokenPrice(token);

  const { updateOracle } = useSwapCardContext();
  async function updateOtherSideAmount() {
    const limitPrice = getValues("limitPrice");
    if (!limitPrice) return;
    const [sellAmount, buyAmount] = calculateAmounts({
      isSellOrder,
      amount,
      limitPrice,
    });
    const anotherSideAmount = side === "Buy" ? sellAmount : buyAmount;
    setValue(
      `amount${side === "Buy" ? "Sell" : "Buy"}` as const,
      anotherSideAmount
    );
  }

  async function updateTokenBalance() {
    const balance = await fetchFormattedBalanceOf({
      token: token,
      address: safeAddress as Address,
      chainId: chainId as ChainId,
    });
    setTokenBalance(balance);
  }

  useEffect(() => {
    // Control if the amount field should be disabled
    setIsAmountDisabled(
      (isSellOrder && side === "Buy") || (!isSellOrder && side === "Sell")
    );
  }, [isSellOrder, side]);

  useEffect(() => {
    // Update token balance on token change
    if (token) {
      updateTokenBalance();
    }
  }, [token, safeAddress]);

  useEffect(() => {
    // Update other side amount on amount change
    if (!isAmountDisabled) {
      updateOtherSideAmount();
    }
  }, [amount]);

  return (
    <Card className="bg-background w-full p-2 rounded-lg">
      <CardTitle className="w-full flex justify-between font-normal text-xs">
        {getCardTitle(isAmountDisabled, side)}
      </CardTitle>
      <CardContent className="flex justify-between gap-2 px-0 py-2 items-start">
        <div className="flex flex-col gap-y-1 min-w-28">
          <TokenSelect
            selectedToken={token}
            onSelectToken={(newToken) => {
              const otherToken = getValues(otherTokenFieldName);
              const tokenSell = side == "Sell" ? newToken : otherToken;
              const tokenBuy = side == "Sell" ? otherToken : newToken;
              if (otherToken) {
                updateOracle({ tokenSell, tokenBuy });
              }
              setValue(tokenFieldName, newToken);
            }}
            errorMessage={errors[tokenFieldName]?.message}
          />
          {token && (
            <span className="text-xs /70">
              <span>
                Balance:{" "}
                {formatNumber(
                  tokenBalance || "0",
                  4,
                  "decimal",
                  "standard",
                  0.0001
                )}{" "}
              </span>
              {!isAmountDisabled &&
                tokenBalance &&
                tokenBalance !== "0" &&
                amount.toString().includes(formatNumber(tokenBalance)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="py-0 px-1 h-fit text-accent text-xs"
                    onClick={() => {
                      setValue(
                        amountFieldName,
                        Number(convertStringToNumberAndRoundDown(tokenBalance))
                      );
                    }}
                  >
                    Max
                  </Button>
                )}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-y-1 w-full items-end overflow-x-auto">
          <Input
            {...register(amountFieldName)}
            type="number"
            step={1 / 10 ** (token ? token.decimals : 18)}
            placeholder="0.0"
            className="w-full border-none shadow-none h-9 focus-visible:ring-transparent placeholder:/70 px-0 text-2xl text-right bg-background"
            disabled={isAmountDisabled}
            min={0}
            max={10 ** 18}
            onKeyDown={preventNegativeKeyDown}
            onPaste={pasteAbsoluteValue}
          />
          <i className="text-xs">
            {`≈ ${formatNumber(
              amount && usdPrice ? amount * (usdPrice || 0) : 0,
              2,
              "currency",
              "standard"
            )}`}
          </i>
        </div>
      </CardContent>
    </Card>
  );
}

export const TokenInputCard = memo(TokenInputCardComponent);

export function getCardTitle(isAmountDisabled: boolean, side: "Sell" | "Buy") {
  if (!isAmountDisabled) {
    return `${side} amount`;
  }
  if (side === "Buy") {
    return "Receive at least";
  } else {
    return "Sell at most";
  }
}
