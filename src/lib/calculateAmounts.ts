import { IStopLossRecipeData } from "./types";

export function calculateAmounts(data: IStopLossRecipeData): [number, number] {
  return [calculateSellAmount(data), calculateBuyAmount(data)];
}

export function calculateSellAmount(data: IStopLossRecipeData): number {
  return data.isSellOrder
    ? data.amount
    : (data.amount * data.strikePrice * (100 - data.allowedSlippage)) / 100;
}

export function calculateBuyAmount(data: IStopLossRecipeData): number {
  return data.isSellOrder
    ? ((data.amount / data.strikePrice) * (100 + data.allowedSlippage)) / 100
    : data.amount;
}
