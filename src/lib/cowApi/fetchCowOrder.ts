import { Address } from "viem";
import { ChainId } from "../publicClients";
import { COW_API_URL_BY_CHAIN_ID } from "./api";
import { fetcher } from "#/utils/fetcher";
import { CowOrder } from "../types";

export async function getCowOrders(userAddress: Address, chainId: ChainId) {
  const baseUrl = COW_API_URL_BY_CHAIN_ID[chainId];
  const url = `${baseUrl}/api/v1/account/${userAddress}/orders?limit=1000`;
  return await fetcher<CowOrder[]>(url);
}
