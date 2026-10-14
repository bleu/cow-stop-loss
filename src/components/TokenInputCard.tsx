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
import { useAccount } from "wagmi";

import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPrice } from "#/hooks/useTokenPrice";
import { ChainId } from "#/lib/publicClients";
import { fetchFormattedBalanceOf } from "#/lib/tokenUtils";
import { SwapData } from "#/lib/types";

import { TokenInfo } from "./TokenInfo";
import { TokenSelect } from "./TokenSelect";

function TokenInputCardComponent({ side }: { side: "Sell" | "Buy" }) {
  const { address: walletAddress, chainId: accountChainId } = useAccount();
  const chainId = accountChainId as ChainId;

  const {
    setValue,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<SwapData>();
  const tokenFieldName = `token${side}` as const;
  const amountFieldName = `amount${side}` as const;

  const [token, amount] = useWatch({
    control,
    name: [tokenFieldName, amountFieldName],
  });

  const tokenAddress = token?.address;
  const tokenDecimals = token?.decimals;
  const tokenSymbol = token?.symbol;
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
  const storedBalance = side === "Buy" ? tokenBuyBalance : tokenSellBalance;
  const setTokenBalance =
    side === "Buy" ? setTokenBuyBalance : setTokenSellBalance;

  const isAmountDisabled = side === "Buy";
  const [balanceFailed, setBalanceError] = useState(false);
  const [balanceScope, setBalanceScope] = useState<string>();
  const [balanceAttempt, retryBalance] = useState(0);
  const currentBalanceScope = `${walletAddress?.toLowerCase()}:${chainId}:${tokenAddress?.toLowerCase()}:${tokenDecimals}`;
  const balanceError = balanceScope === currentBalanceScope && balanceFailed;
  const tokenBalance =
    balanceScope === currentBalanceScope ? storedBalance : undefined;

  useEffect(() => {
    let active = true;
    setBalanceError(false);
    setBalanceScope(undefined);
    setTokenBalance(undefined);
    if (
      tokenAddress &&
      tokenDecimals !== undefined &&
      tokenSymbol !== undefined &&
      walletAddress
    ) {
      fetchFormattedBalanceOf({
        token: {
          address: tokenAddress,
          decimals: tokenDecimals,
          symbol: tokenSymbol,
        },
        address: walletAddress,
        chainId,
      })
        .then((balance) => {
          if (active) {
            setTokenBalance(balance);
            setBalanceScope(currentBalanceScope);
          }
        })
        .catch(() => {
          if (active) {
            setTokenBalance(undefined);
            setBalanceScope(currentBalanceScope);
            setBalanceError(true);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [
    tokenAddress,
    tokenDecimals,
    tokenSymbol,
    chainId,
    walletAddress,
    setTokenBalance,
    balanceAttempt,
    currentBalanceScope,
  ]);

  return (
    <Card className="bg-background w-full p-2 rounded-lg">
      <CardTitle className="w-full flex justify-between font-normal text-xs">
        {getCardTitle(side)}
      </CardTitle>
      <CardContent className="px-0 py-2 items-start flex flex-row justify-between flex-wrap gap-x-2">
        <div className="flex min-w-0 flex-1 flex-col gap-y-1 items-start">
          <Input
            {...register(amountFieldName)}
            type="text"
            inputMode="decimal"
            aria-label={getCardTitle(side)}
            placeholder="0.0"
            className="w-full border-none shadow-none h-9 focus-visible:ring-transparent placeholder:/70 px-0 text-2xl text-left bg-background"
            disabled={isAmountDisabled}
          />
          <i className="text-xs">
            {`≈ ${formatNumber(
              amount && usdPrice ? Number(amount) * usdPrice : 0,
              2,
              "currency",
              "standard",
            )}`}
          </i>
        </div>
        <div className="min-w-32 max-w-40 basis-32 shrink-0">
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
        <div className="w-full">
          {token && (
            <span className="text-xs">
              <span>
                {balanceError ? (
                  "Balance unavailable"
                ) : (
                  <>
                    Balance:{" "}
                    {tokenBalance === undefined
                      ? "Loading..."
                      : formatNumber(
                          tokenBalance,
                          4,
                          "decimal",
                          "standard",
                          0.0001,
                        )}{" "}
                  </>
                )}
              </span>
              {balanceError && (
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Retry ${token.symbol} balance`}
                  className="py-0 px-1 h-fit text-accent text-xs"
                  onClick={() => retryBalance((attempt) => attempt + 1)}
                >
                  Retry
                </Button>
              )}
              {!isAmountDisabled && tokenBalance && tokenBalance !== "0" && (
                <Button
                  type="button"
                  variant="ghost"
                  className="py-0 px-1 h-fit text-accent text-xs"
                  onClick={() => {
                    setValue(amountFieldName, tokenBalance, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
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

function getCardTitle(side: "Sell" | "Buy") {
  return side === "Sell" ? "Sell amount" : "Receive at least";
}
