import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bleu/ui";
import React, { useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { PixelIcon } from "#/components/ui/pixel-icon";
import { useWalletTokenValues } from "#/hooks/useWalletTokenValues";
import { ChainId } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { IToken } from "#/lib/types";
import { formatFiatAmount, formatTokenAmount } from "#/utils/amountFormatting";

import { TokenInfo } from "./TokenInfo";

export function TokenSelect({
  onSelectToken,
  selectedToken,
  disabled = false,
  errorMessage,
}: {
  onSelectToken: (token: IToken) => void;
  selectedToken?: IToken;
  disabled?: boolean;
  errorMessage?: string;
}) {
  const { address, chainId: accountChainId } = useAccount();
  const chainId = (accountChainId ?? 1) as ChainId;
  const [open, setOpen] = useState(false);
  const { sellTokens } = getSupportedTokens(chainId);
  const { data, isLoading, error, mutate } = useWalletTokenValues(
    chainId,
    address,
    open,
  );
  const rows = sellTokens
    .map(({ token }) => ({
      token,
      holding: data?.tokens.find(
        (row) =>
          row.token.address.toLowerCase() === token.address.toLowerCase(),
      ),
    }))
    .sort(
      (a, b) =>
        (b.holding?.usdValue ?? -1) - (a.holding?.usdValue ?? -1) ||
        a.token.symbol.localeCompare(b.token.symbol) ||
        a.token.address.localeCompare(b.token.address),
    );

  function handleSelectToken(token: IToken) {
    onSelectToken(token);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex flex-col">
          <Button
            type="button"
            className={cn(
              "pixel-control rescue-square-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 w-full min-w-0 justify-between gap-2 rounded-none border border-primary/25 bg-primary/10 px-3 text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/15 hover:text-foreground",
              selectedToken
                ? "bg-muted/70 text-foreground hover:text-foreground"
                : "",
            )}
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            {selectedToken ? (
              <TokenInfo token={selectedToken} showExplorerLink={false} />
            ) : (
              "Select token"
            )}
            {!disabled && (
              <PixelIcon name="chevron-down" className="size-4 shrink-0" />
            )}
          </Button>
          {errorMessage && (
            <div className="mt-1 text-sm text-destructive">
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={16}
        className="pixel-frame rescue-popover w-[min(18rem,calc(100vw-2rem))] rounded-none border border-border bg-popover p-0 text-popover-foreground shadow-2xl"
      >
        <p className="border-b border-border/60 px-4 py-3 font-sans text-[10px] uppercase tracking-[0.16em] text-secondary">
          Choose your passenger
        </p>
        {/* @ts-ignore */}
        <Command
          className="rounded-none bg-transparent text-popover-foreground"
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput
            placeholder="Search supported tokens"
            className="rounded-none h-12 border-0 bg-transparent px-4"
          />
          {/* @ts-ignore */}
          <CommandList className="max-h-72 p-1.5">
            {/* @ts-ignore */}
            <CommandEmpty>No results found</CommandEmpty>
            {rows.map(({ token, holding }) => (
              // @ts-ignore
              <CommandItem
                key={token.address}
                value={token.symbol + token.address}
                disabled={disabled}
                onSelect={() => handleSelectToken(token)}
                className="rescue-token-option rounded-none py-2.5 hover:bg-primary/15 hover:text-foreground"
              >
                <TokenInfo token={token} showExplorerLink={false} />
                {address && (
                  <span className="rescue-token-option-values">
                    <span
                      title={
                        holding?.balance !== undefined
                          ? formatUnits(holding.balance, token.decimals)
                          : undefined
                      }
                    >
                      {holding?.balance !== undefined
                        ? formatTokenAmount(
                            formatUnits(holding.balance, token.decimals),
                            token.decimals,
                          )
                        : isLoading
                          ? "Loading…"
                          : "Unavailable"}
                    </span>
                    <span
                      title={
                        holding?.usdValue !== undefined
                          ? `$${holding.usdValue}`
                          : undefined
                      }
                      className="text-muted-foreground"
                    >
                      {holding?.usdValue !== undefined
                        ? `$${formatFiatAmount(holding.usdValue)}`
                        : "-"}
                    </span>
                  </span>
                )}
                <PixelIcon
                  name="check"
                  className={cn(
                    "size-3 shrink-0 text-primary",
                    selectedToken?.address.toLowerCase() !==
                      token.address.toLowerCase() && "invisible",
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        {address &&
          (error || data?.tokens.some((row) => row.balance === undefined)) && (
            <div
              role="status"
              className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-xs text-muted-foreground"
            >
              <span>
                {error ? "Balances unavailable" : "Some balances unavailable"}
              </span>
              <button
                type="button"
                className="min-h-9 px-2 text-primary"
                onClick={() => void mutate()}
              >
                Retry
              </button>
            </div>
          )}
      </PopoverContent>
    </Popover>
  );
}
