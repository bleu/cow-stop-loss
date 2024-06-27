export function calculateAmounts(data: {
  isSellOrder: boolean;
  amount: number;
  limitPrice: number;
}): [number, number] {
  return [calculateSellAmount(data), calculateBuyAmount(data)];
}

export function calculateSellAmount({
  isSellOrder,
  amount,
  limitPrice,
}: {
  isSellOrder: boolean;
  amount: number;
  limitPrice: number;
}): number {
  return isSellOrder ? amount : amount * limitPrice;
}

export function calculateBuyAmount({
  isSellOrder,
  amount,
  limitPrice,
}: {
  isSellOrder: boolean;
  amount: number;
  limitPrice: number;
}): number {
  return isSellOrder ? amount * limitPrice : amount;
}
