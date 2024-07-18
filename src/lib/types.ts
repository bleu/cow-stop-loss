import { Address } from "viem";
import { generateAdvancedSettingsSchema, swapSchema } from "./schema";
import { z } from "zod";
import { UserStopLossOrdersQuery } from "./gql/composable-cow/__generated__/1";
import { ArrElement, GetDeepProp } from "@bleu/ui";

export interface IToken {
  symbol: string;
  decimals: number;
  address: Address;
}

export type OrderStatus = "open" | "canceled" | "fulfilled" | "partiallyFilled";

export interface ITokenWithValue extends IToken {
  balance: string;
  usdPrice: number;
  usdValue: number;
}

export type AdvancedSwapSettings = z.input<
  ReturnType<typeof generateAdvancedSettingsSchema>
>;
export type SwapData = z.input<typeof swapSchema>;

export type DraftOrder = SwapData &
  AdvancedSwapSettings & {
    id: string;
    oraclePrice: number;
    fallbackMarketPrice?: number;
    salt: `0x${string}`;
  };

type StopLossOrderTypeRaw = ArrElement<
  GetDeepProp<UserStopLossOrdersQuery, "items">
>;

export interface StopLossOrderType extends StopLossOrderTypeRaw {
  status: OrderStatus;
  executedBuyAmount?: string;
  executedSellAmount?: string;
  executedSurplusFee?: string;
  filledPct?: number;
  singleOrder?: Address | boolean | undefined;
}

export interface StopLossOrderTypeWithCowOrders extends StopLossOrderType {
  cowOrders: CowOrder[];
}

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
