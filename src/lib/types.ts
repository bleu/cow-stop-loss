export type Address = `0x${string}`;

export interface IToken {
  name: string;
  chainId: number;
  symbol: string;
  decimals: number;
  address: Address;
  logoURI: string;
}

export interface INodeData {
  selected: boolean;
}

export type nodeTypes = "swap" | "stopLoss";

export type timeOptions = "15 minutes" | "1 hour" | "1 day";

export interface ISwapData {
  tokenSell: IToken;
  tokenBuy: IToken;
  sellAmount: string;
  buyAmount: string;
  isSellOrder: boolean;
  validityBucketTime: timeOptions;
  isPartiallyFillable: boolean;
  receiver: Address;
  appData: Address;
}

export interface IStopLossConditionData {
  strikePrice: string;
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
  data: IStopLossRecipeData;
  position?: { x: number; y: number };
}
