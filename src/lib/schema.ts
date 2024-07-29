import { Address, isAddress } from "viem";
import { literal, z } from "zod";
import { normalize } from "viem/ens";

import { ChainId, publicClientsFromIds } from "./publicClients";
import { oracleMinimalAbi } from "./abis/oracleMinimalAbi";
import { mainnet, sepolia } from "viem/chains";

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

const generateOracleSchema = ({ chainId }: { chainId: ChainId }) => {
  const publicClient = publicClientsFromIds[chainId];
  return basicAddressSchema.refine(
    async (value) => {
      return publicClient
        .readContract({
          address: value as Address,
          abi: oracleMinimalAbi,
          functionName: "latestRoundData",
        })
        .then(() => true)
        .catch(() => false);
    },
    {
      message: "Address does not conform to Oracle interface",
    },
  );
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

export const generateAdvancedSettingsSchema = (chainId: ChainId) => {
  return z
    .object({
      maxHoursSinceOracleUpdates: z.coerce
        .number()
        .positive()
        .max(365 * 24),
      tokenSellOracle: z.union([
        generateOracleSchema({ chainId }),
        z.literal(""),
      ]),
      tokenBuyOracle: z.union([
        generateOracleSchema({ chainId }),
        z.literal(""),
      ]),
      receiver: z.union([
        basicAddressSchema,
        generateEnsSchema(chainId),
        literal(""),
      ]),
      partiallyFillable: z.coerce.boolean(),
    })
    .refine(
      (data) => {
        if (!data.tokenSellOracle && data.tokenBuyOracle) {
          return false;
        }
        return true;
      },
      {
        message: "If one oracle is set, both must be set",
        path: ["tokenSellOracle"],
      },
    )
    .refine(
      (data) => {
        if (!data.tokenBuyOracle && data.tokenSellOracle) {
          return false;
        }
        return true;
      },
      {
        message: "If one oracle is set, both must be set",
        path: ["tokenBuyOracle"],
      },
    );
};
