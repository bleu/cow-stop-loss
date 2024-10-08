"use client";
import { formatNumber } from "@bleu/ui";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

import { TokenLogo } from "#/components/TokenLogo";
import { useSafeApp } from "#/hooks/useSafeApp";
import { ChainId } from "#/lib/publicClients";
import { IToken, ITokenWithValue } from "#/lib/types";

import { BlockExplorerLink } from "./ExplorerLink";

export function TokenInfo({
  token,
  showBalance = false,
  showExplorerLink = true,
}: {
  token: IToken | ITokenWithValue;
  showBalance?: boolean;
  showExplorerLink?: boolean;
}) {
  const { chainId } = useSafeApp();
  return (
    <div className="flex items-center gap-x-1">
      <div className="flex shrink-0 items-center justify-center">
        <div className="rounded-full">
          <TokenLogo
            tokenAddress={token.address}
            chainId={chainId as ChainId}
            className="rounded-full"
            alt="Token Logo"
            height={22}
            width={22}
            quality={100}
          />
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <span>{token.symbol}</span>
        {showExplorerLink && (
          <BlockExplorerLink
            type="token"
            label={<ArrowTopRightIcon />}
            identifier={token.address}
            networkId={chainId as ChainId}
          />
        )}
      </div>
      <div>
        {"balance" in token &&
          showBalance &&
          `(${formatNumber(token.balance, 4, "decimal", "compact", 0.001)})`}
      </div>
    </div>
  );
}
