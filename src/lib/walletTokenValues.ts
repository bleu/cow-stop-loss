import {
  type Address,
  type ContractFunctionParameters,
  erc20Abi,
  formatUnits,
  type PublicClient,
} from "viem";

import { oracleMinimalAbi } from "./abis/oracleMinimalAbi";
import { type OracleRound, validateOracleRound } from "./oracleRouter";
import { type ChainId, publicClientsFromIds } from "./publicClients";
import { getSupportedTokens } from "./supportedTokens";
import type { IToken } from "./types";

export interface WalletTokenValue {
  token: IToken;
  balance?: bigint;
  usdPrice?: number;
  usdValue?: number;
}

type ReadResult =
  | { status: "success"; result: unknown }
  | { status: "failure" };

export async function fetchWalletTokenValues({
  chainId,
  account,
  client = publicClientsFromIds[chainId],
}: {
  chainId: ChainId;
  account?: Address;
  client?: PublicClient;
}) {
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  const configured = [...sellTokens, buyToken];
  const contracts: ContractFunctionParameters[] = [];
  const indexes = new Map<string, number>();
  const add = (contract: ContractFunctionParameters) => {
    const key = `${contract.address.toLowerCase()}:${contract.functionName}`;
    const current = indexes.get(key);
    if (current !== undefined) return current;
    indexes.set(key, contracts.length);
    contracts.push(contract);
    return contracts.length - 1;
  };
  const rows = configured.map(({ token, oracles }) => ({
    token,
    oracle: oracles.USD,
    balanceIndex: account
      ? add({
          address: token.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [account],
        })
      : undefined,
    roundIndex: oracles.USD
      ? add({
          address: oracles.USD,
          abi: oracleMinimalAbi,
          functionName: "latestRoundData",
        })
      : undefined,
    decimalsIndex: oracles.USD
      ? add({
          address: oracles.USD,
          abi: oracleMinimalAbi,
          functionName: "decimals",
        })
      : undefined,
  }));
  const block = await client.getBlock();
  const results: ReadResult[] = [];
  // Fixed-size reads keep each batch below viem's calldata limit and bound concurrency.
  for (let start = 0; start < contracts.length; start += 64) {
    const chunk = contracts.slice(start, start + 64);
    try {
      results.push(
        ...(await client.multicall({
          contracts: chunk,
          blockNumber: block.number,
          allowFailure: true,
          batchSize: 4096,
        })),
      );
    } catch {
      results.push(...chunk.map(() => ({ status: "failure" as const })));
    }
  }
  const value = (index: number | undefined) => {
    const result = index !== undefined ? results[index] : undefined;
    return result?.status === "success" ? result.result : undefined;
  };
  const prices = new Map<string, number | undefined>();
  const tokens: WalletTokenValue[] = rows.map(
    ({ token, oracle, balanceIndex, roundIndex, decimalsIndex }) => {
      const balance = value(balanceIndex) as bigint | undefined;
      const feedKey = oracle?.toLowerCase();
      if (feedKey && !prices.has(feedKey)) {
        let price: number | undefined;
        const round = value(roundIndex) as OracleRound | undefined;
        const decimals = value(decimalsIndex) as number | undefined;
        const ceilings = configured
          .filter((entry) => entry.oracles.USD?.toLowerCase() === feedKey)
          .map((entry) => entry.oracleApprovals?.USD?.maxAgeSeconds);
        if (
          round &&
          decimals !== undefined &&
          Number.isInteger(decimals) &&
          decimals >= 0 &&
          decimals <= 18 &&
          ceilings.every(
            (age) => age !== undefined && Number.isSafeInteger(age) && age > 0,
          )
        ) {
          try {
            validateOracleRound({
              round,
              timestamp: block.timestamp,
              maxAge: Math.min(86400, ...(ceilings as number[])),
            });
            const normalized = Number(formatUnits(round[1], decimals));
            if (Number.isFinite(normalized) && normalized > 0)
              price = normalized;
          } catch {
            // An invalid estimate must not hide a usable wallet balance.
          }
        }
        prices.set(feedKey, price);
      }
      const usdPrice = feedKey ? prices.get(feedKey) : undefined;
      const estimate =
        balance !== undefined && usdPrice !== undefined
          ? Number(formatUnits(balance, token.decimals)) * usdPrice
          : undefined;
      const usdValue =
        estimate !== undefined && Number.isFinite(estimate)
          ? estimate
          : undefined;
      return { token, balance, usdPrice, usdValue };
    },
  );
  return { blockNumber: block.number, timestamp: block.timestamp, tokens };
}
