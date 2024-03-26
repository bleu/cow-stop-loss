"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  toast,
} from "@bleu-fi/ui";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { TokenBalance, TokenType } from "@safe-global/safe-apps-sdk";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Address, erc20Abi, formatUnits, isAddress } from "viem";

import { useSafeBalances } from "#/hooks/useSafeBalances";
import { cowTokenList } from "#/lib/cowTokenList";
import { ChainId, publicClientsFromIds } from "#/lib/publicClients";
import { IToken } from "#/lib/types";
import { formatNumber } from "#/utils";

import { tokenLogoUri } from "../../public/tokens/logoUri";
import { Dialog } from "./Dialog";

const TOKEN_IMPORTING_TOKEN_ERROR = {
  title: "Error importing token",
  content: "Check if the address is correct.",
};

export function TokenSelect({
  onSelectToken,
  tokenType,
  selectedToken,
  disabeld = false,
}: {
  onSelectToken: (token: IToken) => void;
  tokenType: "sell" | "buy" | "send";
  selectedToken?: IToken;
  disabeld?: boolean;
}) {
  const [token, setToken] = useState<IToken | undefined>(undefined);

  useEffect(() => {
    if (selectedToken) {
      setToken(selectedToken);
    }
  }, [selectedToken]);

  function handleSelectToken(token: TokenBalance) {
    const newToken = {
      address: token.tokenInfo.address as Address,
      symbol: token.tokenInfo.symbol,
      decimals: token.tokenInfo.decimals,
    };
    onSelectToken(newToken);
    setToken(newToken);
  }

  return (
    <Dialog content={<TokenModal onSelectToken={handleSelectToken} />}>
      <TokenSelectButton
        tokenType={tokenType}
        token={token}
        disabeld={disabeld}
      />
    </Dialog>
  );
}

export function TokenSelectButton({
  tokenType,
  token,
  onClick,
  disabeld = false,
}: {
  tokenType: "sell" | "buy" | "send";
  token?: IToken;
  disabeld?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col w-full">
      <span className="mb-2 block text-sm text-slate12">
        Token to {tokenType}
      </span>
      <button
        type="button"
        //same style as Input.tsx
        className="px-2w-full selection:color-white box-border flex h-[35px] w-full appearance-none items-center justify-between gap-2  bg-blue4 px-[10px] py-1 text-[15px] leading-none text-slate12 shadow-[0_0_0_1px] shadow-blue6 outline-none selection:bg-foreground hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] disabled:bg-blue1"
        disabled={disabeld}
        onClick={onClick}
      >
        <div className="flex items-center gap-1">
          <div className="rounded-full bg-white p-[3px]">
            <Image
              src={
                tokenLogoUri[token?.symbol as keyof typeof tokenLogoUri] ||
                cowTokenList.find((t) => t.symbol === token?.symbol)?.logoURI ||
                "/assets/generic-token-logo.png"
              }
              className="rounded-full"
              alt="Token Logo"
              height={22}
              width={22}
              quality={100}
            />
          </div>
          <div>{token?.symbol}</div>
        </div>
        {!disabeld && <ChevronDownIcon />}
      </button>
    </div>
  );
}

function TokenModal({
  onSelectToken,
}: {
  onSelectToken: (token: TokenBalance) => void;
}) {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const [tokens, setTokens] = useState<(TokenBalance | undefined)[]>(
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

  const { assets, loaded } = useSafeBalances();
  useEffect(() => {
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
  }, [loaded, assets]);

  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const publicClient = publicClientsFromIds[chainId as ChainId];

  function filterTokenInput({
    tokenSearchQuery,
    token,
  }: {
    tokenSearchQuery: string;
    token?: TokenBalance;
  }) {
    {
      if (!token) return false;
      const regex = new RegExp(tokenSearchQuery, "i");
      return regex.test(Object.values(token.tokenInfo).join(","));
    }
  }

  async function manuallyImportToken() {
    if (!isAddress(tokenSearchQuery)) {
      toast(TOKEN_IMPORTING_TOKEN_ERROR);
      return;
    }

    const tokensContracts = ["name", "symbol", "decimals"].map(
      (functionName) => ({
        abi: erc20Abi,
        address: tokenSearchQuery,
        functionName: functionName,
      })
    );
    const data = await publicClient.multicall({ contracts: tokensContracts });

    if (data.some((result) => result.error)) {
      toast(TOKEN_IMPORTING_TOKEN_ERROR);
      return;
    }

    const token = {
      balance: "0",
      fiatBalance: "0",
      fiatConversion: "0",
      tokenInfo: {
        chainId: chainId as ChainId,
        address: tokenSearchQuery,
        decimals: data[2].result as number,
        name: data[0].result as string,
        symbol: data[1].result as string,
        logoUri: "/assets/generic-token-logo.png",
        type: TokenType.ERC20,
      },
    };

    setTokens((prevTokens) => [token, ...prevTokens]);
  }
  return (
    <div className="max-h-[30rem] divide-y divide-slate7 overflow-y-scroll text-background scrollbar-thin scrollbar-track-blue3 scrollbar-thumb-slate12">
      <div className="flex size-full flex-col items-center justify-center gap-y-4 py-4">
        <div className="text-xl">Token Search</div>
        <div className="flex w-full items-center px-10">
          <input
            type="text"
            placeholder="Search name or paste address"
            className="h-9 w-full appearance-none items-center justify-center rounded-l-[4px] bg-blue4 px-[10px] text-sm leading-none text-slate12 outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTokenSearchQuery(e.target.value)
            }
            value={tokenSearchQuery}
          />
          <div className="flex items-center h-9 rounded-r-[4px] bg-slate12 px-2 leading-none outline-none transition disabled:cursor-not-allowed">
            <MagnifyingGlassIcon
              color="rgb(31 41 55)"
              className="font-semibold"
              height={20}
              width={20}
            />
          </div>
          <Button className="mx-2 p-2" onClick={manuallyImportToken}>
            <PlusIcon />
          </Button>
        </div>
      </div>
      <Table color="blue">
        <TableHeader>
          <TableCell>
            <span className="sr-only">Token Logo</span>
          </TableCell>
          <TableCell>Token</TableCell>
          <TableCell>Wallet Balance</TableCell>
        </TableHeader>
        <TableBody>
          {tokens
            .filter((token) => filterTokenInput({ tokenSearchQuery, token }))
            .sort((a, b) =>
              formatUnits(
                BigInt(a!.balance),
                a!.tokenInfo.decimals ? a!.tokenInfo.decimals : 0
              ) <
              formatUnits(
                BigInt(b!.balance),
                b!.tokenInfo.decimals ? b!.tokenInfo.decimals : 0
              )
                ? 1
                : -1
            )
            .map((token) => {
              if (token) {
                return (
                  <TokenRow
                    key={token.tokenInfo.address}
                    token={token}
                    onSelectToken={onSelectToken}
                  />
                );
              }
            })}
        </TableBody>
      </Table>
    </div>
  );
}

function TokenRow({
  token,
  onSelectToken,
}: {
  token: TokenBalance;
  onSelectToken: (token: TokenBalance) => void;
}) {
  return (
    <TableRow
      key={token.tokenInfo.address}
      onClick={() => onSelectToken(token)}
    >
      <TableCell>
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-white p-1">
            <Image
              src={
                tokenLogoUri[
                  token.tokenInfo.symbol as keyof typeof tokenLogoUri
                ] || "/assets/generic-token-logo.png"
              }
              className="rounded-full"
              alt="Token Logo"
              height={28}
              width={28}
              quality={100}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>{token.tokenInfo.symbol}</TableCell>
      <TableCell>
        {token.balance
          ? formatNumber(
              formatUnits(
                BigInt(token.balance),
                token.tokenInfo.decimals ? token.tokenInfo.decimals : 0
              )
            )
          : ""}
      </TableCell>
    </TableRow>
  );
}
