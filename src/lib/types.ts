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
  ON_QUEUE = "queue",
  CREATING = "creating",
  OPEN = "open",
  FULFILLED = "fulfilled",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  CANCELLING = "cancelling",
  PARTIALLY_FILLED = "partially filled and open",
  PARTIALLY_FILLED_AND_CANCELLED = "partially filled and cancelled",
  PARTIALLY_FILLED_AND_EXPIRED = "partially filled adn expired",
  PARTIALLY_FILLED_AND_CANCELLING = "partially filled and cancelling",
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
    validTo: number;
  };

export type CreatingOrder = Omit<DraftOrder, "status"> & {
  status: OrderStatus.CREATING;
  safeTxHash: `0x${string}`;
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
