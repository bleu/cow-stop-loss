import {
  type Abi,
  type Address,
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  erc20Abi,
  type Hex,
  multicall3Abi,
  toHex,
} from "viem";
import { mainnet } from "viem/chains";

import { oracleMinimalAbi } from "#/lib/abis/oracleMinimalAbi";

export const TOKEN_WALLET =
  "0x1111111111111111111111111111111111111111" as const;
export const TOKEN_BLOCK_TIME = BigInt(1_800_000_000);
const abi = [...erc20Abi, ...oracleMinimalAbi] as const;

export function walletTokenRpc() {
  const balances = new Map<string, bigint>();
  const feeds = new Map<
    string,
    {
      decimals: number;
      round: readonly [bigint, bigint, bigint, bigint, bigint];
    }
  >();
  const calls: { method: string; params: unknown[] }[] = [];
  const contractCalls: {
    address: Address;
    functionName: string;
    args?: readonly unknown[];
  }[] = [];
  const client = createPublicClient({
    chain: mainnet,
    transport: custom(
      {
        async request({ method, params }) {
          calls.push({ method, params: params as unknown[] });
          if (method === "eth_getBlockByNumber")
            return {
              number: "0x1312d00",
              timestamp: toHex(TOKEN_BLOCK_TIME),
              transactions: [],
            };
          if (method !== "eth_call")
            throw new Error(`Unexpected RPC method: ${method}`);
          const [transaction] = params as [{ data: Hex }];
          const decoded = decodeFunctionData({
            abi: multicall3Abi,
            data: transaction.data,
          });
          if (decoded.functionName !== "aggregate3")
            throw new Error("Expected Multicall3");
          const results = decoded.args[0].map(({ target, callData }) => {
            const call = decodeFunctionData({ abi, data: callData });
            contractCalls.push({
              address: target,
              functionName: call.functionName,
              args: call.args,
            });
            const feed = feeds.get(target.toLowerCase());
            const balance =
              call.functionName === "balanceOf"
                ? balances.get(
                    `${target.toLowerCase()}:${call.args[0].toLowerCase()}`,
                  )
                : undefined;
            if (call.functionName === "balanceOf" && balance !== undefined)
              return {
                success: true,
                returnData: encodeFunctionResult({
                  abi: erc20Abi,
                  functionName: "balanceOf",
                  result: balance,
                }),
              };
            if (call.functionName === "latestRoundData" && feed)
              return {
                success: true,
                returnData: encodeFunctionResult({
                  abi: oracleMinimalAbi,
                  functionName: "latestRoundData",
                  result: feed.round,
                }),
              };
            if (call.functionName === "decimals" && feed)
              return {
                success: true,
                returnData: encodeFunctionResult({
                  abi: oracleMinimalAbi,
                  functionName: "decimals",
                  result: feed.decimals,
                }),
              };
            return { success: false, returnData: "0x" as Hex };
          });
          return encodeFunctionResult({
            abi: multicall3Abi as Abi,
            functionName: "aggregate3",
            result: [results],
          });
        },
      },
      { retryCount: 0 },
    ),
  });
  return {
    client,
    calls,
    contractCalls,
    setBalance(
      token: Address,
      balance: bigint,
      account: Address = TOKEN_WALLET,
    ) {
      balances.set(`${token.toLowerCase()}:${account.toLowerCase()}`, balance);
    },
    setFeed(
      oracle: Address,
      answer: bigint,
      decimals = 8,
      updatedAt = TOKEN_BLOCK_TIME,
      roundId = BigInt(1),
      answeredInRound = roundId,
    ) {
      feeds.set(oracle.toLowerCase(), {
        decimals,
        round: [roundId, answer, updatedAt, updatedAt, answeredInRound],
      });
    },
  };
}
