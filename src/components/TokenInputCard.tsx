import { Button, formatNumber, Input } from "@bleu/ui";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { memo, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useAccount } from "wagmi";

import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPrice } from "#/hooks/useTokenPrice";
import { ChainId } from "#/lib/publicClients";
import { fetchFormattedBalanceOf } from "#/lib/tokenUtils";
import { SwapData } from "#/lib/types";

import { ValidToInput } from "./swap-card/ValidToInput";
import { TokenInfo } from "./TokenInfo";
import { TokenSelect } from "./TokenSelect";

function TokenInputCardComponent({ side }: { side: "Sell" | "Buy" }) {
  const { address: walletAddress, chainId: accountChainId } = useAccount();
  const chainId = (accountChainId ?? 1) as ChainId;

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

  const [tokenSellBalance, setTokenSellBalance] = useSwapTokenBalances(
    (state) => [state.tokenSellBalance, state.setTokenSellBalance],
  );
  const storedBalance = tokenSellBalance;
  const setTokenBalance = setTokenSellBalance;

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
    <>
      <section
        className={
          "w-full rounded-2xl border border-border/70 bg-card/55 p-3.5 sm:p-4"
        }
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`amount-${side.toLowerCase()}`}
              className={`font-semibold uppercase text-muted-foreground ${side === "Buy" ? "whitespace-nowrap text-[12px] tracking-[0.08em] sm:text-[13px] sm:tracking-[0.12em]" : "text-[13px] tracking-[0.12em]"}`}
            >
              {getCardTitle(side)}
            </label>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <Input
                id={`amount-${side.toLowerCase()}`}
                {...register(amountFieldName)}
                type="text"
                inputMode="decimal"
                aria-label={getCardTitle(side)}
                placeholder="0.0"
                className="h-10 min-w-0 flex-1 rounded-xl border-none bg-transparent px-0 text-left text-xl font-medium tracking-tight tabular-nums shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-transparent sm:text-2xl"
                disabled={isAmountDisabled}
              />
              {amount && Number(amount) > 0 && (
                <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums sm:text-sm">
                  ≈{" "}
                  {formatNumber(
                    usdPrice ? Number(amount) * usdPrice : 0,
                    2,
                    "currency",
                    "standard",
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="w-36 shrink-0 sm:w-40">
            {side === "Buy" ? (
              token && (
                <div
                  aria-disabled="true"
                  className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-border/70 bg-muted/50 px-3 text-muted-foreground"
                >
                  <TokenInfo token={token} showExplorerLink={false} />
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 opacity-45"
                  />
                </div>
              )
            ) : (
              <TokenSelect
                selectedToken={token}
                disabled={isSubmitting}
                onSelectToken={(newToken) => {
                  setValue("strikePrice", "");
                  setValue("tokenSell", newToken, { shouldValidate: true });
                }}
                errorMessage={errors.tokenSell?.message}
              />
            )}
          </div>
        </div>
        {side === "Sell" && token && (
          <div className="mt-1 flex min-h-7 items-center gap-2 text-[13px] text-muted-foreground">
            <span className="whitespace-nowrap">
              {!walletAddress
                ? "Connect wallet to view balance"
                : balanceError
                  ? "Balance unavailable"
                  : `Balance: ${tokenBalance === undefined ? "Loading…" : formatNumber(tokenBalance, 4, "decimal", "standard", 0.0001)}`}
            </span>
            {balanceError && (
              <Button
                type="button"
                variant="ghost"
                aria-label={`Retry ${token.symbol} balance`}
                className="h-fit px-1 py-0 text-[13px] text-primary"
                onClick={() => retryBalance((attempt) => attempt + 1)}
              >
                Retry
              </Button>
            )}
            {tokenBalance && tokenBalance !== "0" && (
              <Button
                type="button"
                variant="ghost"
                className="h-fit px-1 py-0 text-[13px] text-primary"
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
          </div>
        )}
      </section>
      {side === "Buy" && token && (
        <div className="mt-1 px-1 text-[13px] text-muted-foreground">
          <ValidToInput />
        </div>
      )}
    </>
  );
}

export const TokenInputCard = memo(TokenInputCardComponent);

function getCardTitle(side: "Sell" | "Buy") {
  return side === "Sell" ? "Sell amount" : "Receive at least";
}
