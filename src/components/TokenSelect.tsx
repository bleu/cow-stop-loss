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

import { useSafeApp } from "#/hooks/useSafeApp";
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
  const { chainId } = useSafeApp();
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
              "flex px-2 justify-between rounded-full space-x-1",
              selectedToken
                ? "bg-muted text-white hover:text-primary-foreground"
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
      <PopoverContent>
        {/* @ts-ignore */}
        <Command>
          <CommandInput placeholder="Search supported tokens" />
          {/* @ts-ignore */}
          <CommandList>
            {/* @ts-ignore */}
            <CommandEmpty>No results found</CommandEmpty>
            {sellTokens.map(({ token }) => (
              // @ts-ignore
              <CommandItem
                key={token.address}
                value={token.symbol + token.address}
                disabled={disabled}
                onSelect={() => handleSelectToken(token)}
                className="hover:bg-primary hover:text-primary-foreground"
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
