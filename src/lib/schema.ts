import { Address, isAddress } from "viem";
import { z } from "zod";
import { normalize } from "viem/ens";

import { IToken, TIME_OPTIONS } from "./types";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { fetchCowQuote } from "./cowApi/fetchCowQuote";
import { oracleMinimalAbi } from "./abis/oracleMinimalAbi";
import { capitalize } from "@bleu/ui";
import { CHAINS_ORACLE_ROUTER_FACTORY } from "./oracleRouter";

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

const ensSchema = z
  .string()
  .min(1)
  .refine((value) => value.includes(".eth"), {
    message: "Provided address is invalid",
  })
  .transform(async (value) => {
    const publicClient = publicClientsFromIds[1];
    return (await publicClient.getEnsAddress({
      name: normalize(value),
    })) as Address;
  })
  .refine((value) => isAddress(value), {
    message: "Provided address is invalid",
  });

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
      message: "Oracle contract not found",
    }
  );
};

export const stopLossConditionSchema = z
  .object({
    strikePrice: z.coerce.number().positive(),
    currentOraclePrice: z.coerce.number().positive().optional(),
    tokenSellOracle: basicAddressSchema,
    tokenBuyOracle: basicAddressSchema,
    maxTimeSinceLastOracleUpdate: z.nativeEnum(TIME_OPTIONS),
  })
  .refine((data) => data.tokenSellOracle != data.tokenBuyOracle, {
    path: ["tokenBuyOracle"],
    message: "Tokens sell and buy must be different",
  });

export const swapSchema = z.object({
  tokenSell: basicTokenSchema,
  tokenBuy: basicTokenSchema,
  amount: z.coerce.number().positive(),
  allowedSlippage: z.coerce.number().nonnegative().lt(100),
  receiver: z.union([basicAddressSchema, ensSchema]),
  isPartiallyFillable: z.coerce.boolean(),
  validFrom: z.coerce.string(),
  isSellOrder: z.coerce.boolean(),
  validityBucketTime: z.nativeEnum(TIME_OPTIONS),
});

export const generateStopLossRecipeSchema = ({
  chainId,
}: {
  chainId: ChainId;
}) =>
  z
    .object({
      tokenSell: basicTokenSchema,
      tokenBuy: basicTokenSchema,
      amount: z.coerce.number().positive(),
      allowedSlippage: z.coerce.number().nonnegative().lt(100),
      receiver: basicAddressSchema,
      isPartiallyFillable: z.coerce.boolean(),
      validFrom: z.coerce.string(),
      isSellOrder: z.coerce.boolean(),
      validityBucketTime: z.nativeEnum(TIME_OPTIONS),
      strikePrice: z.coerce.number().positive(),
      tokenSellOracle: generateOracleSchema({ chainId }),
      tokenBuyOracle: generateOracleSchema({ chainId }),
      maxTimeSinceLastOracleUpdate: z.nativeEnum(TIME_OPTIONS),
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
      const oracleRouter = new CHAINS_ORACLE_ROUTER_FACTORY[chainId as ChainId](
        {
          chainId: chainId as ChainId,
          tokenBuy: data.tokenBuy as IToken,
          tokenSell: data.tokenSell as IToken,
        }
      );

      return oracleRouter
        .calculatePrice({
          tokenBuyOracle: data.tokenBuyOracle as Address,
          tokenSellOracle: data.tokenSellOracle as Address,
        })
        .then((oraclePrice) => {
          if (data.strikePrice > oraclePrice) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Strike price must be below the oracle price",
            });
          }
        })
        .catch(() => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Oracle contract not found",
          });
        });
    })
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
            message: `${res.errorType}: ${capitalize(res.description)}`,
          });
        }
      });
    });
