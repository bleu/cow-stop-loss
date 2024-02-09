export type Address = `0x${string}`;

export interface IToken {
  symbol: string;
  decimals: number;
  address: Address;
}

export interface INodeData {
  selected: boolean;
}

export type nodeTypes = "swap" | "stopLoss";

export enum TIME_OPTIONS {
  MINUTE_15 = "1 minute",
  HOUR = "1 hour",
  DAY = "1 day",
}

export const TIME_OPTIONS_SECONDS = {
  [TIME_OPTIONS.MINUTE_15]: 60 * 15,
  [TIME_OPTIONS.HOUR]: 60 * 60,
  [TIME_OPTIONS.DAY]: 60 * 60 * 24,
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
  tokenSell: IToken;
  tokenBuy: IToken;
  maxTimeSinceLastOracleUpdate: TIME_OPTIONS;
}

export type IStopLossRecipeData = ISwapData & IStopLossConditionData;

export interface INode {
  id: string;
  type: nodeTypes;
  position?: { x: number; y: number };
}
