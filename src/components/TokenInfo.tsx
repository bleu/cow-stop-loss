import { formatNumber } from "@bleu/ui";

import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

import { TokenLogo } from "./TokenLogo";

export function TokenInfo({
  chainId,
  amount,
  token,
}: {
  token: IToken;
  chainId?: ChainId;
  amount?: number | string;
}) {
  return (
    <div className="flex items-center gap-x-1">
      <div className="flex items-center justify-center">
        <div className="rounded-full bg-white p-1">
          <TokenLogo
            tokenAddress={token.address}
            chainId={chainId}
            className="rounded-full"
            alt="Token Logo"
            height={22}
            width={22}
            quality={100}
          />
        </div>
      </div>
      {token.symbol}
      {amount && `(${formatNumber(amount, 4, "decimal", "compact", 0.001)})`}
    </div>
  );
}
