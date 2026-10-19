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
import { ChevronDownIcon } from "@radix-ui/react-icons";
import React, { useState } from "react";
import { useAccount } from "wagmi";

import { ChainId } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { IToken } from "#/lib/types";

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
  const { chainId: accountChainId } = useAccount();
  const chainId = (accountChainId ?? 1) as ChainId;
  const [open, setOpen] = useState(false);
  const { sellTokens } = getSupportedTokens(chainId);

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
              "pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 w-full min-w-0 justify-between gap-2 rounded-none border border-primary/25 bg-primary/10 px-3 text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/15 hover:text-foreground",
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
            {!disabled && <ChevronDownIcon className="size-4 shrink-0" />}
          </Button>
          {errorMessage && (
            <div className="mt-1 text-sm text-destructive">
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="pixel-frame rescue-popover w-[min(22rem,calc(100vw-2rem))] rounded-none border border-border bg-popover p-0 text-popover-foreground shadow-2xl">
        <p className="border-b border-border/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-secondary">
          Choose your passenger
        </p>
        {/* @ts-ignore */}
        <Command className="rounded-none bg-transparent text-popover-foreground">
          <CommandInput
            placeholder="Search supported tokens"
            className="rounded-none h-12 border-0 bg-transparent px-4"
          />
          {/* @ts-ignore */}
          <CommandList className="max-h-72 p-1.5">
            {/* @ts-ignore */}
            <CommandEmpty>No results found</CommandEmpty>
            {sellTokens.map(({ token }) => (
              // @ts-ignore
              <CommandItem
                key={token.address}
                value={token.symbol + token.address}
                disabled={disabled}
                onSelect={() => handleSelectToken(token)}
                className="rounded-none py-2.5 hover:bg-primary/15 hover:text-foreground"
              >
                <TokenInfo token={token} showExplorerLink={false} />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
