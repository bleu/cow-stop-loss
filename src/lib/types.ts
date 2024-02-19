import { Address } from "viem";
import { ChainId } from "./publicClients";

export interface IToken {
  symbol: string;
  decimals: number;
  address: Address;
}

export type nodeNames = "swap" | "stopLoss" | "hookMultiSend";

export enum TIME_OPTIONS {
  MINUTE_15 = "1 minute",
  HOUR = "1 hour",
  DAY = "1 day",
  YEAR = "1 year",
}

export const TIME_OPTIONS_SECONDS = {
  [TIME_OPTIONS.MINUTE_15]: 60 * 15,
  [TIME_OPTIONS.HOUR]: 60 * 60,
  [TIME_OPTIONS.DAY]: 60 * 60 * 24,
  [TIME_OPTIONS.YEAR]: 60 * 60 * 24 * 365,
};
export interface ISwapData {
  tokenSell: IToken;
  tokenBuy: IToken;
  amount: number;
  allowedSlippage: number;
  isSellOrder: boolean;
  validityBucketTime: TIME_OPTIONS;
  isPartiallyFillable: boolean;
  receiver: Address;
}

export interface IStopLossConditionData {
  strikePrice: number;
  tokenSellOracle: Address;
  tokenBuyOracle: Address;
  maxTimeSinceLastOracleUpdate: TIME_OPTIONS;
}

export enum HOOK_TYPES {
  MULTI_SEND = "MULTI_SEND",
}

export interface BaseHook {
  type: HOOK_TYPES;
}

export interface IMultiSendData extends BaseHook {
  type: HOOK_TYPES.MULTI_SEND;
  safeAddress: Address;
  token: IToken;
  amountPerReceiver: number;
  receivers: Address[];
}

export type IHooks = IMultiSendData;
export interface IStopLossRecipeData extends ISwapData, IStopLossConditionData {
  preHooks: IMultiSendData[];
  chainId: ChainId;
}

export type INodeData = ISwapData | IStopLossRecipeData | IMultiSendData;
