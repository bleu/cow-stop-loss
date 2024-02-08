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

export type timeOptions = "15 minutes" | "1 hour" | "1 day";

export const timeOptionsValues = ["15 minutes", "1 hour", "1 day"];

export interface ISwapData {
  tokenSell: IToken;
  tokenBuy: IToken;
  amount: number;
  allowedSlippage: number;
  isSellOrder: boolean;
  validityBucketTime: timeOptions;
  isPartiallyFillable: boolean;
  receiver: Address;
}

export interface IStopLossConditionData {
  strikePrice: number;
  tokenSellOracle: Address;
  tokenBuyOracle: Address;
  tokenSell: IToken;
  tokenBuy: IToken;
  maxTimeSinceLastOracleUpdate: timeOptions;
}

export type IStopLossRecipeData = ISwapData & IStopLossConditionData;

export interface INode {
  id: string;
  type: nodeTypes;
  position?: { x: number; y: number };
}
