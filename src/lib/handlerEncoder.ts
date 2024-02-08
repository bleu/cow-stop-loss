import { encodeAbiParameters } from "viem";
import { calculateAmounts } from "./calculateAmounts";
import { IStopLossRecipeData } from "./types";
import { timeOptionsToSeconds } from "./timeOptions";

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
  const validityBucketSeconds = timeOptionsToSeconds(data.validityBucketTime);
  const maxTimeSinceLastOracleUpdateSeconds = timeOptionsToSeconds(
    data.maxTimeSinceLastOracleUpdate
  );
  const strikePriceWithDecimals = BigInt(data.strikePrice * 10 ** 18);
  const [sellAmount, buyAmount] = calculateAmounts(data);
  const sellAmountWithDecimals = BigInt(
    sellAmount * 10 ** data.tokenSell.decimals
  );
  const buyAmountWithDecimals = BigInt(
    buyAmount * 10 ** data.tokenBuy.decimals
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
    validityBucketSeconds,
    data.tokenSellOracle,
    data.tokenBuyOracle,
    strikePriceWithDecimals,
    maxTimeSinceLastOracleUpdateSeconds,
  ]);
}
