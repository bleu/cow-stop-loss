import { Address, erc20Abi, formatUnits } from "viem";

import { getPlacementReads } from "./placementReads";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { IToken } from "./types";

export async function fetchFormattedBalanceOf({
  token,
  address,
  chainId,
}: {
  token: IToken;
  address: Address;
  chainId: ChainId;
}): Promise<string> {
  const publicClient = getPlacementReads({ account: address, chainId }).client;
  const bigIntBalance = await publicClient.readContract({
    abi: erc20Abi,
    address: token.address as Address,
    functionName: "balanceOf",
    args: [address],
  });
  return formatUnits(bigIntBalance, token.decimals);
}

export async function fetchTokenInfo(
  tokenAddress: Address,
  chainId: ChainId,
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
