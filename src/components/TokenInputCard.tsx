import { Button, Input } from "@bleu/ui";
import { memo, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { TokenLogo } from "#/components/TokenLogo";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useWalletTokenValues } from "#/hooks/useWalletTokenValues";
import { ChainId } from "#/lib/publicClients";
import { SwapData } from "#/lib/types";
import {
  formatFiatAmount,
  formatInputAmount,
  formatTokenAmount,
} from "#/utils/amountFormatting";
import { isDecimalInput } from "#/utils/inputs";

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

  const amountInput = register(amountFieldName);
  const [token, amount, tokenSell] = useWatch({
    control,
    name: [tokenFieldName, amountFieldName, "tokenSell"],
  });
  const receiveAmount = token && tokenSell ? amount : "";
  const { data, error, isLoading, mutate } = useWalletTokenValues(
    chainId,
    walletAddress,
    Boolean(token),
  );
  const holding = data?.tokens.find(
    ({ token: row }) =>
      row.address.toLowerCase() === token?.address.toLowerCase(),
  );
  const usdPrice = holding?.usdPrice;
  const tokenBalance =
    walletAddress && holding?.balance !== undefined && token
      ? formatUnits(holding.balance, token.decimals)
      : undefined;
  const balanceError = Boolean(
    walletAddress &&
    token &&
    !isLoading &&
    (error || (data && holding?.balance === undefined)),
  );
  const setTokenSellBalance = useSwapTokenBalances(
    (state) => state.setTokenSellBalance,
  );
  const isAmountDisabled = side === "Buy";

  useEffect(() => {
    if (side === "Sell") setTokenSellBalance(tokenBalance);
  }, [side, tokenBalance, setTokenSellBalance]);

  return (
    <div className="rescue-token-group" data-side={side.toLowerCase()}>
      <section
        className={
          side === "Buy"
            ? "rescue-receive-summary flex w-full items-center gap-2 border-t border-border/60 px-1 pt-2"
            : "rescue-token-card pixel-inset w-full rounded-none border border-border/80 bg-muted/35 p-3 transition-colors focus-within:border-primary/70"
        }
      >
        <div
          className={
            side === "Buy"
              ? "contents"
              : "rescue-token-heading mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
          }
        >
          <label
            htmlFor={`amount-${side.toLowerCase()}`}
            className={`font-semibold uppercase text-muted-foreground ${side === "Buy" ? "shrink-0 whitespace-nowrap text-[11px] tracking-[0.04em] sm:text-xs" : "text-[13px] tracking-[0.12em]"}`}
          >
            {getCardTitle(side)}
          </label>
        </div>
        <div
          className={
            side === "Buy"
              ? "flex min-w-0 flex-1 items-center justify-between gap-2"
              : "rescue-token-amount flex min-w-0 items-center justify-between gap-3"
          }
        >
          <div className="min-w-0 flex-1">
            <div
              className={
                side === "Buy"
                  ? "flex min-w-0 items-center gap-2"
                  : "rescue-token-value mt-0.5 flex min-w-0 items-center gap-2"
              }
            >
              {side === "Buy" ? (
                <output
                  id="amount-buy"
                  aria-label="Receive at least"
                  title={receiveAmount}
                  className="min-w-0 cursor-default truncate py-0 text-[18px] font-medium tracking-tight text-muted-foreground opacity-50 tabular-nums"
                >
                  {receiveAmount
                    ? `≈ ${formatTokenAmount(receiveAmount, token?.decimals)}`
                    : "0.0"}
                </output>
              ) : (
                <Input
                  id={`amount-${side.toLowerCase()}`}
                  {...amountInput}
                  value={
                    isAmountDisabled
                      ? formatInputAmount(amount ?? "", token?.decimals)
                      : (amount ?? "")
                  }
                  title={isAmountDisabled ? amount : undefined}
                  onChange={(event) => {
                    if (isDecimalInput(event.target.value))
                      void amountInput.onChange(event);
                  }}
                  type="text"
                  inputMode="decimal"
                  aria-label={getCardTitle(side)}
                  placeholder="0.0"
                  className="h-11 min-w-0 flex-1 rounded-none border-none bg-transparent px-0 text-left text-[28px] font-medium tracking-tight tabular-nums shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring sm:text-[28px]"
                  disabled={isAmountDisabled}
                />
              )}
              {side === "Sell" && amount && Number(amount) > 0 && usdPrice && (
                <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums sm:text-sm">
                  ≈ ${formatFiatAmount(Number(amount) * usdPrice)}
                </span>
              )}
            </div>
          </div>
          <div
            className={side === "Buy" ? "shrink-0" : "w-32 shrink-0 sm:w-40"}
          >
            {side === "Buy" ? (
              token && (
                <span
                  title={token.symbol}
                  className="flex h-8 items-center gap-2 whitespace-nowrap text-sm text-muted-foreground"
                >
                  <TokenLogo
                    tokenAddress={token.address}
                    chainId={chainId}
                    alt={`${token.symbol} token`}
                    width={22}
                    height={22}
                    className="rounded-full"
                  />
                  <span>{token.symbol}</span>
                </span>
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
        {side === "Sell" && (
          <div className="rescue-token-balance mt-1 flex min-h-5 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {token && (
              <>
                <span className="whitespace-nowrap">
                  {!walletAddress
                    ? "Connect wallet to view balance"
                    : balanceError
                      ? "Balance unavailable"
                      : `Balance: ${tokenBalance === undefined ? "Loading…" : formatTokenAmount(tokenBalance, token.decimals)}`}
                </span>
                {balanceError && (
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Retry ${token.symbol} balance`}
                    className="rescue-secondary-control min-h-0 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-auto p-0 text-xs text-primary underline-offset-4 hover:underline"
                    onClick={() => void mutate()}
                  >
                    Retry
                  </Button>
                )}
                {tokenBalance && tokenBalance !== "0" && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rescue-secondary-control min-h-0 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-auto p-0 text-xs text-primary underline-offset-4 hover:underline"
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
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export const TokenInputCard = memo(TokenInputCardComponent);

function getCardTitle(side: "Sell" | "Buy") {
  return side === "Sell" ? "Sell amount" : "Receive at least";
}
