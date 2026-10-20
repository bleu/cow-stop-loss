import { formatNumber } from "@bleu/ui";

import { IToken } from "#/lib/types";

export function TokenAmount({
  token,
  balance,
  usdPrice,
}: {
  token: IToken;
  balance: number | string;
  usdPrice: number;
}) {
  return (
    <div className="flex flex-col items-end">
      <span>
        {typeof balance === "string" ? balance : formatNumber(balance, 4)}{" "}
        {token.symbol}
      </span>
      <i className="text-xs h-5">
        ≈ {usdPrice > 0 && `$${formatNumber(Number(balance) * usdPrice, 2)}`}
      </i>
    </div>
  );
}
