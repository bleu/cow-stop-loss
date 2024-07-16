import { formatNumber } from "@bleu/ui";

import { IToken } from "#/lib/types";

export function TokenAmount({
  token,
  balance,
  usdPrice,
}: {
  token: IToken;
  balance: number;
  usdPrice: number;
}) {
  return (
    <div className="flex flex-col items-end">
      <span>
        {formatNumber(balance, 4)} {token.symbol}
      </span>
      <i className="text-xs h-5">
        ≈ {usdPrice > 0 && `$${formatNumber(balance * usdPrice, 2)}`}
      </i>
    </div>
  );
}
