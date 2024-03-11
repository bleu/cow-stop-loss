import { isAddress } from "viem";
import { z } from "zod";
import { TIME_OPTIONS } from "./types";
import { ChainId } from "./publicClients";
import { fetchCowQuote } from "./cowApi/fetchCowQuote";
import { capitalize } from "../utils";

const basicAddressSchema = z
  .string()
  .min(1)
  .refine((value) => isAddress(value), {
    message: "Provided address is invalid",
  });

const basicTokenSchema = z.object({
  address: basicAddressSchema,
  decimals: z.number().positive(),
  symbol: z.string(),
});

export const stopLossConditionSchema = z.object({
  strikePrice: z.coerce.number().positive(),
  tokenSellOracle: basicAddressSchema,
  tokenBuyOracle: basicAddressSchema,
  maxTimeSinceLastOracleUpdate: z.nativeEnum(TIME_OPTIONS),
});

export const generateSwapSchema = ({ chainId }: { chainId: ChainId }) =>
  z
    .object({
      tokenSell: basicTokenSchema,
      tokenBuy: basicTokenSchema,
      amount: z.coerce.number().positive(),
      allowedSlippage: z.coerce.number().positive(),
      receiver: basicAddressSchema,
      isPartiallyFillable: z.coerce.boolean(),
      validFrom: z.coerce.string(),
      isSellOrder: z.coerce.boolean(),
      validityBucketTime: z.nativeEnum(TIME_OPTIONS),
    })
    .refine(
      (data) => {
        return data.tokenSell.address != data.tokenBuy.address;
      },
      {
        path: ["tokenBuy"],
        message: "Tokens sell and buy must be different",
      }
    )
    .superRefine((data, ctx) => {
      const amountDecimals = data.isSellOrder
        ? data.tokenSell.decimals
        : data.tokenBuy.decimals;
      return fetchCowQuote({
        tokenIn: data.tokenSell,
        tokenOut: data.tokenBuy,
        amount: data.amount * 10 ** amountDecimals,
        chainId,
        priceQuality: "fast",
        isSell: data.isSellOrder,
      }).then((res) => {
        if (res.errorType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: capitalize(res.description),
            path: ["tokenBuy"],
          });
        }
      });
    });

export const multiSendHookSchema = z.object({
  type: z.literal("MULTI_SEND"),
  safeAddress: basicAddressSchema,
  token: basicTokenSchema,
  amountPerReceiver: z.coerce.number().positive(),
  receivers: basicAddressSchema.array().nonempty(),
});
