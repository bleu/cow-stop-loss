import {
  Button,
  Command,
  CommandInput,
  CommandItem,
  FormLabel,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bleu-fi/ui";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useEffect, useState } from "react";
import { Address } from "viem";

import { cowTokenList } from "#/lib/cowTokenList";
import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

import { TokenInfo } from "./TokenInfo";

export function TokenSelect({
  onSelectToken,
  selectedToken,
  disabled = false,
  label,
  errorMessage,
}: {
  onSelectToken: (token: IToken) => void;
  selectedToken?: IToken;
  disabled?: boolean;
  label?: string;
  errorMessage?: string;
}) {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const [open, setOpen] = useState(false);
  const tokens = cowTokenList.filter(
    (token) => token.chainId === chainId
  ) as IToken[];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState<IToken | undefined>(
    undefined
  );

  const { safe } = useSafeAppsSDK();

  useEffect(() => {
    if (selectedToken) {
      setSelectedValue(selectedToken);
    }
  }, [selectedToken]);

  function handleSelectToken(token: IToken) {
    onSelectToken(token);
    setSelectedValue(token);
    setOpen(false);
  }

  function filterTokens(token: IToken) {
    if (!searchQuery) return true;
    const regex = new RegExp(searchQuery, "i");
    return regex.test(token.symbol);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex flex-col">
            <FormLabel className="mb-2 block text-sm">{label}</FormLabel>
            <Button
              variant="secondary"
              type="button"
              className="px-2 justify-between border text-primary-foreground border-border bg-input hover:bg-input/20 hover:text-accent-foreground"
              disabled={disabled}
              onClick={() => setOpen(true)}
            >
              {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                selectedValue ? (
                  <TokenInfo
                    token={selectedValue}
                    chainId={safe.chainId as ChainId}
                  />
                ) : (
                  "Select Token"
                )
              }
              {!disabled && <ChevronDownIcon />}
            </Button>
            {errorMessage && (
              <FormMessage className="mt-1 h-6 text-sm text-destructive">
                <span>{errorMessage}</span>
              </FormMessage>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput
              // TODO: COW-179
              disabled
              placeholder="Search token..."
              className="h-9"
              onValueChange={(search: string) => setSearchQuery(search)}
            />
            {tokens.filter(filterTokens).length === 0 && (
              <CommandItem disabled>No tokens found on the Safe</CommandItem>
            )}
            {tokens.filter(filterTokens).map((token) => (
              <CommandItem
                key={token.address}
                onSelect={() => handleSelectToken(token)}
              >
                <TokenInfo
                  token={{
                    address: token.address as Address,
                    symbol: token.symbol,
                    decimals: token.decimals,
                  }}
                  chainId={safe.chainId as ChainId}
                />
              </CommandItem>
            ))}
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
