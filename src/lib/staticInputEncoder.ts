import { encodeAbiParameters, Hex, parseUnits } from "viem";

import { getOrderAmounts } from "./calculateAmounts";
import { DraftOrder } from "./types";

export const stopLossDataStructure = [
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
    name: "validTo",
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

export function encodeStopLossStaticInput(
  data: DraftOrder,
  appDataHex: Hex,
): Hex {
  const { sellAtoms, buyAtoms } = getOrderAmounts(data);
  const strikePriceWithDecimals = parseUnits(data.strikePrice, 18);

  return encodeAbiParameters(stopLossDataStructure, [
    data.tokenSell.address,
    data.tokenBuy.address,
    sellAtoms,
    buyAtoms,
    appDataHex,
    data.receiver,
    data.isSellOrder,
    data.partiallyFillable,
    Math.floor(data.validTo),
    data.tokenSellOracle,
    data.tokenBuyOracle,
    strikePriceWithDecimals,
    (data.maxHoursSinceOracleUpdates * 3600).toFixed(),
  ]);
}
