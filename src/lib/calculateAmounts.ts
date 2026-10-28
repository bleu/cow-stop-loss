import { formatUnits, parseUnits } from "viem";
import { z } from "zod";

import type { LimitPriceSource, SwapData } from "./types";

const slippageMessage =
  "Slippage must be between 0% and 99.99% with at most two decimal places";

export const slippagePercentSchema = z
  .string()
  .regex(/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/, slippageMessage)
  .refine((value) => Number(value) < 100, slippageMessage);

export interface LimitPriceInput {
  strikePrice: string;
  slippagePercent: string;
  limitPriceSource?: LimitPriceSource;
  limitPrice?: string;
}

export interface AmountInput extends LimitPriceInput {
  isSellOrder: boolean;
  amount: string;
  sellDecimals: number;
  buyDecimals: number;
}

function parsePositiveDecimal(value: string, decimals: number, label: string) {
  const message =
    label === "Amount"
      ? "Amount must be positive"
      : `${label} must be positive with at most ${decimals} decimal places`;
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

export function calculateLimitPrice({
  strikePrice,
  slippagePercent,
  limitPriceSource,
  limitPrice,
}: LimitPriceInput): string {
  if (
    limitPriceSource !== undefined &&
    limitPriceSource !== "slippage" &&
    limitPriceSource !== "price"
  ) {
    throw new Error("Limit price source must be price or slippage");
  }
  if (limitPriceSource === "price") {
    const trigger = parsePositiveDecimal(strikePrice, 18, "Trigger price");
    const limit = parsePositiveDecimal(limitPrice ?? "", 22, "Limit price");
    if (limit > trigger * BigInt(10000)) {
      throw new Error("Limit price must not exceed the trigger price");
    }
    return formatUnits(limit, 22);
  }
  const slippage = slippagePercentSchema.safeParse(slippagePercent);
  if (!slippage.success) throw new Error(slippageMessage);
  const limit =
    parsePositiveDecimal(strikePrice, 18, "Trigger price") *
    (BigInt(10000) - parseUnits(slippage.data, 2));
  return formatUnits(limit, 22);
}

export function calculateSlippagePercent(
  strikePrice: string,
  limitPrice: string,
): string {
  const limit = parseUnits(
    calculateLimitPrice({
      strikePrice,
      slippagePercent: "",
      limitPriceSource: "price",
      limitPrice,
    }),
    22,
  );
  const trigger =
    parsePositiveDecimal(strikePrice, 18, "Trigger price") * BigInt(10000);
  return formatUnits(((trigger - limit) * parseUnits("100", 18)) / trigger, 18);
}

export function calculateAmounts({
  isSellOrder,
  amount,
  strikePrice,
  slippagePercent,
  limitPriceSource,
  limitPrice,
  sellDecimals,
  buyDecimals,
}: AmountInput) {
  if (isSellOrder !== true)
    throw new Error("Only exact-sell orders are supported.");
  const limit = parseUnits(
    calculateLimitPrice({
      strikePrice,
      slippagePercent,
      limitPriceSource,
      limitPrice,
    }),
    22,
  );
  const sellAmount = parsePositiveDecimal(amount, sellDecimals, "Amount");
  const buyNumerator = sellAmount * limit * parseUnits("1", buyDecimals);
  const buyDenominator = parseUnits("1", sellDecimals + 22);
  const buyAmount =
    (buyNumerator + buyDenominator - BigInt(1)) / buyDenominator;

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
    amount: data.amountSell,
    strikePrice: data.strikePrice,
    slippagePercent: data.slippagePercent,
    limitPriceSource: data.limitPriceSource,
    limitPrice: data.limitPrice,
    sellDecimals: data.tokenSell.decimals,
    buyDecimals: data.tokenBuy.decimals,
  });
  if (
    data.limitPriceSource !== "price" &&
    data.limitPrice !== undefined &&
    parsePositiveDecimal(data.limitPrice, 22, "Limit price") !==
      parseUnits(amounts.limitPrice, 22)
  ) {
    throw new Error(
      "Saved limit price does not match its trigger and slippage",
    );
  }
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
