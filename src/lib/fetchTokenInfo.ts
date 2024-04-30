import { Address, erc20Abi } from "viem";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { IToken } from "./types";

export async function fetchTokenInfo(
  tokenAddress: Address,
  chainId: ChainId
): Promise<IToken> {
  const publicClient = publicClientsFromIds[chainId];
  const [symbol, decimals] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    }),
  ]);
  return {
    address: tokenAddress as Address,
    decimals,
    symbol,
  };
}
