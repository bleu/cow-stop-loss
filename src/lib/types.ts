import { Address } from "viem";
import { generateAdvancedSettingsSchema, generateSwapSchema } from "./schema";
import { z } from "zod";

export interface IToken {
  symbol: string;
  decimals: number;
  address: Address;
}

export interface ITokenWithValue extends IToken {
  balance: string;
  usdPrice: number;
  usdValue: number;
}

export type AdvancedSwapSettings = z.input<
  ReturnType<typeof generateAdvancedSettingsSchema>
>;
export type SwapData = z.input<ReturnType<typeof generateSwapSchema>>;

export type DraftOrder = SwapData &
  AdvancedSwapSettings & {
    id: string;
  };
