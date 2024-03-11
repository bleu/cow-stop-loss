"use client";

import { Address, encodeAbiParameters, parseUnits } from "viem";

import { calculateAmounts } from "./calculateAmounts";
import { IStopLossRecipeData, TIME_OPTIONS_SECONDS } from "./types";
import { HookFactory } from "./hooksFactory";
import { MetadataApi } from "@cowprotocol/app-data";
import { uploadAppData } from "./cowApi/uploadAppData";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";

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

export async function stopLossArgsEncoder(
  data: IStopLossRecipeData,
  salt: Address
): Promise<`0x${string}`> {
  const { safe } = useSafeAppsSDK();
  const preHooks = HookFactory.createCoWHooks(data.preHooks);
  const postHooks = HookFactory.createCoWHooks(data.postHooks);
  const metadataApi = new MetadataApi();

  const appDataDoc = await metadataApi.generateAppDataDoc({
    metadata: {
      hooks: {
        pre: preHooks,
        post: postHooks,
      },
      widget: {
        appCode: "Stop Loss",
       "ponderId": `${salt}-${safe.safeAddress}-${safe.chainId}`
      }
    },
  });
  const { appDataHex, appDataContent } =
    await metadataApi.appDataToCid(appDataDoc);
  await uploadAppData({
    fullAppData: appDataContent,
    appDataHex,
    chainId: data.chainId,
  });

  const strikePriceWithDecimals = parseUnits(String(data.strikePrice), 18);
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
    appDataHex,
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
