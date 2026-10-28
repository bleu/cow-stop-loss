"use client";
import { useAccount } from "wagmi";

import { TokenLogo } from "#/components/TokenLogo";
import { PixelIcon } from "#/components/ui/pixel-icon";
import { ChainId } from "#/lib/publicClients";
import { IToken, ITokenWithValue } from "#/lib/types";
import { formatTokenAmount } from "#/utils/amountFormatting";

import { BlockExplorerLink } from "./ExplorerLink";

export function TokenInfo({
  token,
  chainId: tokenChainId,
  showBalance = false,
  showExplorerLink = true,
}: {
  token: IToken | ITokenWithValue;
  chainId?: ChainId;
  showBalance?: boolean;
  showExplorerLink?: boolean;
}) {
  const { chainId: accountChainId } = useAccount();
  const chainId = tokenChainId ?? ((accountChainId ?? 1) as ChainId);
  return (
    <div className="flex min-w-0 items-center gap-x-1.5">
      <div className="flex shrink-0 items-center justify-center">
        <div className="rounded-full">
          <TokenLogo
            tokenAddress={token.address}
            chainId={chainId}
            className="rounded-full ring-1 ring-white/10"
            alt="Token Logo"
            height={22}
            width={22}
            quality={100}
          />
        </div>
      </div>
      <div className="flex min-w-0 items-center space-x-1">
        <span className="truncate font-medium">{token.symbol}</span>
        {showExplorerLink && (
          <BlockExplorerLink
            type="token"
            label={<PixelIcon name="external-link" className="size-4" />}
            identifier={token.address}
            networkId={chainId}
          />
        )}
      </div>
      <div>
        {"balance" in token &&
          showBalance &&
          `(${formatTokenAmount(token.balance, token.decimals)})`}
      </div>
    </div>
  );
}
