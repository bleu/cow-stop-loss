import { Address, isAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import { literal, z } from "zod";

import { ChainId, publicClientsFromIds } from "./publicClients";
import { getSupportedTokens } from "./supportedTokens";
import type { IToken } from "./types";

const basicAddressSchema = z.custom<Address>((val) => {
  return typeof val === "string" ? isAddress(val) : false;
});

const basicTokenSchema = z.object({
  address: basicAddressSchema,
  decimals: z.number().positive(),
  symbol: z.string(),
});

export enum VALID_TO_OPTIONS {
  MINUTES_30 = "30 minutes",
  HOUR = "1 hour",
  DAY = "1 day",
  DAYS_3 = "3 days",
  DAYS_7 = "7 days",
  MONTH_1 = "1 month",
  MONTHS_6 = "6 months (max)",
}
export enum VALID_TO_VALUES_MAP {
  "30 minutes" = 30 * 60,
  "1 hour" = 60 * 60,
  "1 day" = 24 * 60 * 60,
  "3 days" = 3 * 24 * 60 * 60,
  "7 days" = 7 * 24 * 60 * 60,
  "1 month" = 30 * 24 * 60 * 60,
  "6 months (max)" = 6 * 30 * 24 * 60 * 60,
}

const generateEnsSchema = (chainId: number) => {
  if (chainId === mainnet.id || chainId === sepolia.id) {
    return z
      .string()
      .min(1)
      .refine((value) => value.includes(".eth"), {
        message: "Provided address is invalid",
      })
      .transform(async (value) => {
        const publicClient = publicClientsFromIds[chainId];
        return (await publicClient.getEnsAddress({
          name: normalize(value),
        })) as Address;
      })
      .refine((value) => isAddress(value), {
        message: "Provided address is invalid",
      });
  }
  return basicAddressSchema;
};

export const swapSchema = z
  .object({
    tokenSell: basicTokenSchema,
    tokenBuy: basicTokenSchema,
    amountSell: z.coerce.number().positive(),
    amountBuy: z.coerce.number().positive(),
    strikePrice: z.coerce.number().positive(),
    limitPrice: z.coerce.number().positive(),
    isSellOrder: z.coerce.boolean(),
    validTo: z.nativeEnum(VALID_TO_OPTIONS),
  })
  .refine(
    (data) => {
      return data.tokenSell.address != data.tokenBuy.address;
    },
    {
      path: ["tokenBuy"],
      message: "Tokens sell and buy must be different",
    },
  );

function matchesToken(token: IToken, supportedToken: IToken) {
  return (
    token.address.toLowerCase() === supportedToken.address.toLowerCase() &&
    token.decimals === supportedToken.decimals &&
    token.symbol === supportedToken.symbol
  );
}

export const generateSwapSchema = (chainId: ChainId) => {
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  return swapSchema.superRefine((data, context) => {
    if (!sellTokens.some(({ token }) => matchesToken(data.tokenSell, token))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tokenSell"],
        message: "Unsupported sell token on this chain",
      });
    }
    if (!matchesToken(data.tokenBuy, buyToken.token)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tokenBuy"],
        message: "Use the fixed USDC buy token for this chain",
      });
    }
  });
};

export const generateAdvancedSettingsSchema = (chainId: ChainId) => {
  return z.object({
    maxHoursSinceOracleUpdates: z.coerce
      .number()
      .positive()
      .max(365 * 24),
    receiver: z.union([
      basicAddressSchema,
      generateEnsSchema(chainId),
      literal(""),
    ]),
    partiallyFillable: z.coerce.boolean(),
  });
};
