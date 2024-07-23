import { Address } from "viem";
import { generateAdvancedSettingsSchema, swapSchema } from "./schema";
import { z } from "zod";
import { ORDER_QUERY } from "./ponderApi/queries";
import { ResultOf } from "gql.tada";

export interface IToken {
  symbol: string;
  decimals: number;
  address: Address;
}

export enum OrderStatus {
  DRAFT = "draft",
  OPEN = "open",
  FULFILLED = "fulfilled",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  CANCELLING = "cancelling",
  PARTIALLY_FILLED = "partiallyFilled",
  PARTIALLY_FILLED_AND_CANCELLED = "partiallyFilledAndCancelled",
  PARTIALLY_FILLED_AND_EXPIRED = "partiallyFilledAndExpired",
  PARTIALLY_FILLED_AND_CANCELLING = "partiallyFilledAndCancelling",
}
export interface ITokenWithValue extends IToken {
  balance: string;
  usdPrice: number;
  usdValue: number;
}

export type AdvancedSwapSettings = z.input<
  ReturnType<typeof generateAdvancedSettingsSchema>
>;
export type SwapData = z.output<typeof swapSchema>;

export type DraftOrder = Omit<SwapData, "validTo"> &
  AdvancedSwapSettings & {
    id: string;
    status: OrderStatus.DRAFT;
    oraclePrice: number;
    fallbackMarketPrice?: number;
    salt: `0x${string}`;
    blockTimestamp?: null;
    validTo: number;
  };
export interface CowOrder {
  appData: string;
  availableBalance: string;
  buyAmount: string;
  buyToken: string;
  buyTokenBalance: string;
  class: string;
  creationDate: string;
  executedBuyAmount: string;
  executedFeeAmount: string;
  executedSellAmount: string;
  executedSellAmountBeforeFees: string;
  executedSurplusFee: string;
  feeAmount: string;
  fullAppData: string;
  fullFeeAmount: string;
  interactions: {
    pre: Array<string>;
    post: Array<string>;
  };
  invalidated: boolean;
  isLiquidityOrder: boolean;
  kind: string;
  owner: string;
  partiallyFillable: boolean;
  receiver: string;
  sellAmount: string;
  sellToken: string;
  sellTokenBalance: string;
  settlementContract: string;
  signature: string;
  signingScheme: string;
  solverFee: string;
  status: string;
  uid: string;
  validTo: number;
}
export type IStopLossPonder = ResultOf<typeof ORDER_QUERY>["order"];

export type StopLossOrderType = IStopLossPonder & {
  status: OrderStatus;
  canceled: boolean;
  cowOrder?: CowOrder;
};
