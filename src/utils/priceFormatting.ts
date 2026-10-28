import { formatInputAmount } from "./amountFormatting";

export function formatMarketPriceForInput(price: number) {
  return formatInputAmount(price);
}
