import { formatUnits, parseUnits } from "viem";
import { z } from "zod";

import type { SwapData } from "./types";

const slippageMessage =
  "Slippage must be between 0% and 99.99% with at most two decimal places";

export const slippagePercentSchema = z
  .string()
  .regex(/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/, slippageMessage)
  .refine((value) => Number(value) < 100, slippageMessage);

export interface AmountInput {
  isSellOrder: boolean;
  amount: string;
  strikePrice: string;
  slippagePercent: string;
  sellDecimals: number;
  buyDecimals: number;
}

function parsePositiveDecimal(value: string, decimals: number, label: string) {
  const message = `${label} must be positive with at most ${decimals} decimal places`;
  if (
    !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value) ||
    (value.split(".")[1]?.length || 0) > decimals
  ) {
    throw new Error(message);
  }
  const result = parseUnits(value, decimals);
  if (result <= BigInt(0)) throw new Error(message);
  return result;
}

export function calculateAmounts({
  isSellOrder,
  amount,
  strikePrice,
  slippagePercent,
  sellDecimals,
  buyDecimals,
}: AmountInput) {
  const slippage = slippagePercentSchema.safeParse(slippagePercent);
  if (!slippage.success) throw new Error(slippageMessage);
  const limit =
    parsePositiveDecimal(strikePrice, 18, "Trigger price") *
    (BigInt(10000) - parseUnits(slippage.data, 2));
  const primaryAmount = parsePositiveDecimal(
    amount,
    isSellOrder ? sellDecimals : buyDecimals,
    "Amount",
  );
  const buyNumerator = primaryAmount * limit * parseUnits("1", buyDecimals);
  const buyDenominator = parseUnits("1", sellDecimals + 22);
  const sellAmount = isSellOrder
    ? primaryAmount
    : (primaryAmount * parseUnits("1", sellDecimals + 22)) /
      (limit * parseUnits("1", buyDecimals));
  const buyAmount = isSellOrder
    ? (buyNumerator + buyDenominator - BigInt(1)) / buyDenominator
    : primaryAmount;

  if (sellAmount === BigInt(0) || buyAmount === BigInt(0)) {
    throw new Error("Amount is too small for this token's precision");
  }

  return {
    amountSell: formatUnits(sellAmount, sellDecimals),
    amountBuy: formatUnits(buyAmount, buyDecimals),
    limitPrice: formatUnits(limit, 22),
  };
}

export function getOrderAmounts(data: Omit<SwapData, "validTo">) {
  const amounts = calculateAmounts({
    isSellOrder: data.isSellOrder,
    amount: data.isSellOrder ? data.amountSell : data.amountBuy,
    strikePrice: data.strikePrice,
    slippagePercent: data.slippagePercent,
    sellDecimals: data.tokenSell.decimals,
    buyDecimals: data.tokenBuy.decimals,
  });
  const sellAtoms = parsePositiveDecimal(
    data.amountSell,
    data.tokenSell.decimals,
    "Amount",
  );
  const buyAtoms = parsePositiveDecimal(
    data.amountBuy,
    data.tokenBuy.decimals,
    "Amount",
  );
  if (
    sellAtoms !== parseUnits(amounts.amountSell, data.tokenSell.decimals) ||
    buyAtoms !== parseUnits(amounts.amountBuy, data.tokenBuy.decimals)
  ) {
    throw new Error("Draft amounts do not match its trigger and slippage");
  }
  return { sellAtoms, buyAtoms };
}
