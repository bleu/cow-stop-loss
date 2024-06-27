import { formatNumber } from "@bleu/ui";
import { IToken } from "./types";

export function getOrderDescription({
  isSellOrder,
  amountSell,
  tokenSell,
  amountBuy,
  tokenBuy,
  orderExecuted = false,
}: {
  isSellOrder?: boolean;
  amountSell: number;
  tokenSell: IToken;
  amountBuy: number;
  tokenBuy: IToken;
  orderExecuted?: boolean;
}) {
  if (orderExecuted) {
    return `Sold ${formatNumber(amountSell, 4)} ${tokenSell.symbol} for ${formatNumber(amountBuy, 4)} ${tokenBuy.symbol}`;
  }
  return `Sell ${formatNumber(amountSell, 4)} ${tokenSell.symbol} ${isSellOrder ? `` : `at most`} for ${isSellOrder ? `at least` : ``} ${formatNumber(amountBuy, 4)} ${tokenBuy.symbol}`;
}
