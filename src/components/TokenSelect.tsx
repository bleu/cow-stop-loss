import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  FormLabel,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  toast,
} from "@bleu/ui";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useState } from "react";
import { Address, isAddress } from "viem";

import { useBuilder } from "#/contexts/builder";
import { fetchTokenInfo } from "#/lib/fetchTokenInfo";
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
  const [search, setSearch] = useState("");
  const { tokenList, addImportedToken } = useBuilder();

  const { safe } = useSafeAppsSDK();

  function handleSelectToken(token: IToken) {
    onSelectToken(token);
    setOpen(false);
  }

  async function handleImportToken() {
    try {
      const importedToken = await fetchTokenInfo(
        search as Address,
        chainId as ChainId
      );
      handleSelectToken(importedToken);
      addImportedToken(importedToken);
      toast({
        title: "Token imported",
      });
    } catch (e) {
      toast({
        title: "Error importing token",
        variant: "destructive",
      });
    }
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
                selectedToken ? (
                  <TokenInfo
                    token={selectedToken}
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
          <Command
            filter={(value, search) => {
              setSearch(search);
              if (!search) return 1;
              const regex = new RegExp(search, "i");
              return Number(regex.test(value));
            }}
            value={selectedToken?.symbol}
          >
            <CommandInput placeholder="Search token..." className="h-9" />
            <CommandList>
              <CommandEmpty onSelect={handleImportToken}>
                No results found
              </CommandEmpty>
              {tokenList.map((token) => (
                <CommandItem
                  key={token.address}
                  value={token.symbol + token.address}
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
              {isAddress(search) && (
                <CommandItem
                  key={search}
                  value={search}
                  onSelect={handleImportToken}
                >
                  Import token
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
