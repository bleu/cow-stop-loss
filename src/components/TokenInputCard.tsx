import { Button, formatNumber, Input } from "@bleu/ui";
import { memo, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { PixelIcon } from "#/components/ui/pixel-icon";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useWalletTokenValues } from "#/hooks/useWalletTokenValues";
import { ChainId } from "#/lib/publicClients";
import { SwapData } from "#/lib/types";

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
          "rescue-token-card pixel-inset w-full rounded-none border border-border/80 bg-muted/35 p-3 transition-colors focus-within:border-primary/70"
        }
      >
        <div className="rescue-token-heading mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <label
            htmlFor={`amount-${side.toLowerCase()}`}
            className={`font-semibold uppercase text-muted-foreground ${side === "Buy" ? "whitespace-nowrap text-[12px] tracking-[0.08em] sm:text-[13px] sm:tracking-[0.12em]" : "text-[13px] tracking-[0.12em]"}`}
          >
            {getCardTitle(side)}
          </label>
        </div>
        <div className="rescue-token-amount flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="rescue-token-value mt-0.5 flex min-w-0 items-center gap-2">
              <Input
                id={`amount-${side.toLowerCase()}`}
                {...register(amountFieldName)}
                type="text"
                inputMode="decimal"
                aria-label={getCardTitle(side)}
                placeholder="0.0"
                className="h-11 min-w-0 flex-1 rounded-none border-none bg-transparent px-0 text-left text-[28px] font-medium tracking-tight tabular-nums shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring sm:text-[28px]"
                disabled={isAmountDisabled}
              />
              {amount && Number(amount) > 0 && usdPrice && (
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
          <div className="w-32 shrink-0 sm:w-40">
            {side === "Buy" ? (
              token && (
                <div
                  aria-disabled="true"
                  className="pixel-inset flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-none border border-border/70 bg-muted/50 px-3 text-muted-foreground"
                >
                  <TokenInfo token={token} showExplorerLink={false} />
                  <PixelIcon
                    name="chevron-down"
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
        {side === "Sell" && (
          <div className="rescue-token-balance mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {token && (
              <>
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
