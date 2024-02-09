import { encodeAbiParameters, parseUnits } from "viem";
import { calculateAmounts } from "./calculateAmounts";
import { IStopLossRecipeData, TIME_OPTIONS_SECONDS } from "./types";

const stopLossDataStructure = [
  {
    name: "sellToken",
    type: "address",
  },
  {
    name: "buyToken",
    type: "address",
  },
  {
    name: "sellAmount",
    type: "uint256",
  },
  {
    name: "buyAmount",
    type: "uint256",
  },
  {
    name: "appData",
    type: "bytes32",
  },
  {
    name: "receiver",
    type: "address",
  },
  {
    name: "isSellOrder",
    type: "bool",
  },
  {
    name: "isPartiallyFillable",
    type: "bool",
  },
  {
    name: "validityBucketSeconds",
    type: "uint32",
  },
  {
    name: "sellTokenPriceOracle",
    type: "address",
  },
  {
    name: "buyTokenPriceOracle",
    type: "address",
  },
  {
    name: "strike",
    type: "int256",
  },
  {
    name: "maxTimeSinceLastOracleUpdate",
    type: "uint32",
  },
];

export function stopLossArgsEncoder(data: IStopLossRecipeData): `0x${string}` {
  const appData = "0x".concat(...Array(64).fill("0")); // TODO: encode appData using CoW lib
  const strikePriceWithDecimals = BigInt(data.strikePrice * 10 ** 18);
  const [sellAmount, buyAmount] = calculateAmounts(data);
  const sellAmountWithDecimals = parseUnits(
    String(sellAmount),
    data.tokenSell.decimals
  );
  const buyAmountWithDecimals = parseUnits(
    String(buyAmount),
    data.tokenBuy.decimals
  );
  return encodeAbiParameters(stopLossDataStructure, [
    data.tokenSell.address,
    data.tokenBuy.address,
    sellAmountWithDecimals,
    buyAmountWithDecimals,
    appData as `0x${string}`,
    data.receiver,
    data.isSellOrder,
    data.isPartiallyFillable,
    TIME_OPTIONS_SECONDS[data.validityBucketTime],
    data.tokenSellOracle,
    data.tokenBuyOracle,
    strikePriceWithDecimals,
    TIME_OPTIONS_SECONDS[data.maxTimeSinceLastOracleUpdate],
  ]);
}
