import { IToken } from "#/lib/types";
import { formatFiatAmount, formatTokenAmount } from "#/utils/amountFormatting";

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
      <span title={`${balance} ${token.symbol}`}>
        {formatTokenAmount(balance, token.decimals)} {token.symbol}
      </span>
      <i
        title={usdPrice > 0 ? `$${Number(balance) * usdPrice}` : undefined}
        className="text-xs h-5"
      >
        ≈ {usdPrice > 0 && `$${formatFiatAmount(Number(balance) * usdPrice)}`}
      </i>
    </div>
  );
}
