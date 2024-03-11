import { Address } from "viem";
import { ChainId } from "../publicClients";
import { COW_API_URL_BY_CHAIN_ID } from "./api";
import { fetcher } from "#/utils/fetcher";

export async function getCowOrders(
    userAddress: Address,
    chainId: ChainId,
  ) {
    const baseUrl = COW_API_URL_BY_CHAIN_ID[chainId];
    const url = `${baseUrl}/api/v1/account/${userAddress}/orders`;
    return await fetcher(url)
  }
  