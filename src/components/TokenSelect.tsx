/* eslint-disable tailwindcss/no-custom-classname */
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
import { TokenBalance, TokenType } from "@safe-global/safe-apps-sdk";
import React, { useEffect, useState } from "react";
import { Address } from "viem";

import { useSafeBalances } from "#/hooks/useSafeBalances";
import { cowTokenList } from "#/lib/cowTokenList";
import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

import { TokenLogo } from "./TokenLogo";

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
  const [tokens, setTokens] = useState<TokenBalance[]>(
    cowTokenList
      .filter((token) => token.chainId === chainId)
      .map((token) => {
        return {
          balance: "0",
          fiatBalance: "0",
          fiatConversion: "0",
          tokenInfo: {
            address: token.address,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol,
            logoUri: token.logoURI,
            type: TokenType.ERC20,
          },
        };
      })
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState<IToken | undefined>(
    undefined
  );

  const { assets, loaded } = useSafeBalances();
  const { safe } = useSafeAppsSDK();

  useEffect(() => {
    if (selectedToken) {
      setSelectedValue(selectedToken);
    }

    if (loaded) {
      const tokens = assets.map((asset) => {
        return {
          ...asset,
        };
      });

      setTokens((prevTokens) => {
        const combinedTokens = [...prevTokens, ...tokens].reduce<{
          [key: string]: TokenBalance;
        }>((acc, token) => {
          const balanceBigInt = BigInt(token?.balance ?? 0);
          const address = token?.tokenInfo?.address ?? "";

          if (!acc[address] || balanceBigInt > BigInt(acc[address].balance)) {
            acc[address] = token as TokenBalance;
          }
          return acc;
        }, {});
        return Object.values(combinedTokens);
      });
    }
  }, [selectedToken, loaded, assets]);

  function handleSelectToken(token: TokenBalance) {
    const tokenForPriceChecker = {
      address: token.tokenInfo.address as Address,
      symbol: token.tokenInfo.symbol,
      decimals: token.tokenInfo.decimals,
    };
    onSelectToken(tokenForPriceChecker);
    setSelectedValue(tokenForPriceChecker);
    setOpen(false);
  }

  function filterTokens(token: TokenBalance) {
    if (!searchQuery) return true;
    const regex = new RegExp(searchQuery, "i");
    return regex.test(token.tokenInfo.symbol);
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
              className="px-2 justify-between border border-border bg-input hover:bg-input/20 hover:text-accent-foreground"
              disabled={disabled}
              onClick={() => setOpen(true)}
            >
              <div className="flex items-center gap-1">
                <div className="rounded-full bg-input p-[3px]">
                  <TokenLogo
                    tokenAddress={selectedValue?.address}
                    chainId={safe.chainId as ChainId}
                    className="rounded-full"
                    alt="Token Logo"
                    height={22}
                    width={22}
                    quality={100}
                  />
                </div>
                <div>{selectedValue?.symbol || "Select Token"}</div>
              </div>
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
                key={token.tokenInfo.address}
                onSelect={() => handleSelectToken(token)}
              >
                <div className="flex items-center">
                  <TokenLogo
                    tokenAddress={token.tokenInfo.address}
                    chainId={safe.chainId as ChainId}
                    alt="Token Logo"
                    className="rounded-full"
                    height={22}
                    width={22}
                  />
                  <span className="ml-2">{token.tokenInfo.symbol}</span>
                </div>
              </CommandItem>
            ))}
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
