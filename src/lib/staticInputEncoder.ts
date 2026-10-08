import { encodeAbiParameters, parseUnits } from "viem";

import { MetadataApi } from "@cowprotocol/app-data";
import { getOrderAmounts } from "./calculateAmounts";
import { uploadAppData } from "./cowApi/uploadAppData";
import { StopLossOrderArgs } from "./transactionFactory";

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

export async function stopLossArgsEncoder(
  data: StopLossOrderArgs,
): Promise<`0x${string}`> {
  const { sellAtoms, buyAtoms } = getOrderAmounts(data);
  const metadataApi = new MetadataApi();

  const appDataDoc = await metadataApi.generateAppDataDoc({
    metadata: {
      widget: {
        appCode: "Stop Loss",
      },
    },
  });
  const { appDataHex, appDataContent } =
    await metadataApi.appDataToCid(appDataDoc);
  await uploadAppData({
    fullAppData: appDataContent,
    appDataHex,
    chainId: data.chainId,
  });

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
