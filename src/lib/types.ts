import { Address } from "viem";
import { z } from "zod";

import type { IRoute } from "./oracleRouter";
import { generateAdvancedSettingsSchema, swapSchema } from "./schema";

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
  PARTIALLY_FILLED_AND_EXPIRED = "partially filled and expired",
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
  AdvancedSwapSettings &
  IRoute & {
    id: string;
    readonly limitPrice: string;
    status: OrderStatus.DRAFT;
    oraclePrice: number;
    salt: `0x${string}`;
    validTo: number;
  };
