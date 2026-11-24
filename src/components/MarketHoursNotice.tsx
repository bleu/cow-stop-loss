import { configuredRouteMarketHours } from "#/lib/oracleRouter";
import { type ChainId, robinhood } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { WarningNotice } from "./ui/warning-notice";

export function MarketHoursNotice({
  chainId,
  tokenSell,
  tokenBuy,
}: {
  chainId: ChainId;
  tokenSell?: IToken;
  tokenBuy?: IToken;
}) {
  if (chainId !== robinhood.id || !tokenSell || !tokenBuy) return null;
  try {
    if (
      configuredRouteMarketHours({ chainId, tokenSell, tokenBuy }) !==
      "us_equities_24/5"
    )
      return null;
  } catch {
    return null;
  }
  return (
    <WarningNotice>
      This Stock Token feed does not update outside its 24/5 session. A
      stop-loss can still execute after the market closes while the last price
      is fresh.
    </WarningNotice>
  );
}
