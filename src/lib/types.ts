import { Address } from "viem";
import { ChainId } from "./publicClients";
import { SafeInfo } from "@safe-global/safe-apps-sdk";

export interface IToken {
  symbol: string;
  decimals: number;
  address: Address;
}

export type nodeNames = "swap" | "stopLoss" | "hookMultiSend";

export enum TIME_OPTIONS {
  MINUTE_15 = "15 minutes",
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

export interface BaseNode {
  orderId: number;
}
export interface ISwapData extends BaseNode {
  tokenSell: IToken;
  tokenBuy: IToken;
  amount: number;
  allowedSlippage: number;
  isSellOrder: boolean;
  validityBucketTime: TIME_OPTIONS;
  isPartiallyFillable: boolean;
  receiver: Address;
}

export interface IStopLossConditionData extends BaseNode {
  strikePrice: number;
  tokenSellOracle?: Address;
  tokenBuyOracle?: Address;
  maxTimeSinceLastOracleUpdate: TIME_OPTIONS;
  oracleError?: boolean;
}

export enum HOOK_TYPES {
  MULTI_SEND = "MULTI_SEND",
  MINT_BAL = "MINT_BAL",
}

export interface BaseHook extends BaseNode {
  type: HOOK_TYPES;
}

export interface IMintBalData extends BaseHook {
  type: HOOK_TYPES.MINT_BAL;
  gauges: Address[];
  safeAddress: Address;
  chainId: ChainId;
}

export interface IMultiSendData extends BaseHook {
  type: HOOK_TYPES.MULTI_SEND;
  safeAddress: Address;
  token: IToken;
  amountPerReceiver: number;
  receivers: Address[];
}

export type IHooks = IMultiSendData | IMintBalData;
export interface IStopLossRecipeData extends ISwapData, IStopLossConditionData {
  ordersData: ISwapData;
  preHooks: IMultiSendData[];
  postHooks: IMultiSendData[];
  safeInfo: SafeInfo;
}

export type INodeData =
  | ISwapData
  | IStopLossRecipeData
  | IMultiSendData
  | IMintBalData
  | BaseNode
  | undefined;

export interface IEdgeData {
  orderId: number;
}
