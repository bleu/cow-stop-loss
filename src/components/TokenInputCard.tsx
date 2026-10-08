import {
  Button,
  Card,
  CardContent,
  CardTitle,
  formatNumber,
  Input,
} from "@bleu/ui";
import { memo, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useSafeApp } from "#/hooks/useSafeApp";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPrice } from "#/hooks/useTokenPrice";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { fetchFormattedBalanceOf } from "#/lib/tokenUtils";
import { SwapData } from "#/lib/types";
import { convertStringToNumberAndRoundDown } from "#/utils";
import { pasteAbsoluteValue, preventNegativeKeyDown } from "#/utils/inputs";

import { TokenInfo } from "./TokenInfo";
import { TokenSelect } from "./TokenSelect";

function TokenInputCardComponent({ side }: { side: "Sell" | "Buy" }) {
  const { safeAddress, chainId } = useSafeApp();

  const {
    setValue,
    register,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useFormContext<SwapData>();
  const tokenFieldName = `token${side}` as const;
  const amountFieldName = `amount${side}` as const;

  const [isAmountDisabled, setIsAmountDisabled] = useState(false);

  const [token, isSellOrder, amount] = useWatch({
    control,
    name: [tokenFieldName, "isSellOrder", amountFieldName],
  });

  const { data: usdPrice } = useTokenPrice(token);

  const [
    tokenSellBalance,
    tokenBuyBalance,
    setTokenBuyBalance,
    setTokenSellBalance,
  ] = useSwapTokenBalances((state) => [
    state.tokenSellBalance,
    state.tokenBuyBalance,
    state.setTokenBuyBalance,
    state.setTokenSellBalance,
  ]);
  const tokenBalance = side === "Buy" ? tokenBuyBalance : tokenSellBalance;
  const setTokenBalance =
    side === "Buy" ? setTokenBuyBalance : setTokenSellBalance;

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
      anotherSideAmount,
    );
  }

  useEffect(() => {
    // Control if the amount field should be disabled
    setIsAmountDisabled(
      (isSellOrder && side === "Buy") || (!isSellOrder && side === "Sell"),
    );
  }, [isSellOrder, side]);

  useEffect(() => {
    let active = true;
    setTokenBalance(undefined);
    if (token) {
      fetchFormattedBalanceOf({
        token,
        address: safeAddress,
        chainId,
      })
        .then((balance) => {
          if (active) setTokenBalance(balance);
        })
        .catch(() => {
          if (active) setTokenBalance(undefined);
        });
    }
    return () => {
      active = false;
    };
  }, [token, chainId, safeAddress, setTokenBalance]);

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
      <CardContent className="px-0 py-2 items-start flex flex-row justify-between flex-wrap">
        <div className="min-w-32 max-w-40 basis-32">
          {side === "Buy" ? (
            token && (
              <div className="flex h-9 items-center px-2">
                <TokenInfo token={token} showExplorerLink={false} />
              </div>
            )
          ) : (
            <TokenSelect
              selectedToken={token}
              disabled={isSubmitting}
              onSelectToken={(newToken) => {
                setValue("tokenSell", newToken, { shouldValidate: true });
              }}
              errorMessage={errors.tokenSell?.message}
            />
          )}
        </div>
        <div className="flex flex-col gap-y-1 items-end overflow-x-auto basis-1/2 grow">
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
          <i className="text-xs pr-1">
            {`≈ ${formatNumber(
              amount && usdPrice ? amount * (usdPrice || 0) : 0,
              2,
              "currency",
              "standard",
            )}`}
          </i>
        </div>
        <div className="w-full">
          {token && (
            <span className="text-xs">
              <span>
                Balance:{" "}
                {formatNumber(
                  tokenBalance || "0",
                  4,
                  "decimal",
                  "standard",
                  0.0001,
                )}{" "}
              </span>
              {!isAmountDisabled && tokenBalance && tokenBalance !== "0" && (
                <Button
                  type="button"
                  variant="ghost"
                  className="py-0 px-1 h-fit text-accent text-xs"
                  onClick={() => {
                    setValue(
                      amountFieldName,
                      Number(
                        convertStringToNumberAndRoundDown(
                          tokenBalance,
                          token.decimals,
                        ),
                      ),
                    );
                  }}
                >
                  Max
                </Button>
              )}
            </span>
          )}
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
