import { ChainId } from "../publicClients";
import { COW_API_URL_BY_CHAIN_ID } from "./api";
import { fetcher } from "#/utils/fetcher";
import { CowOrder } from "../types";

export async function getCowOrderByUid(
  orderUid: `0x${string}`,
  chainId: ChainId,
) {
  const baseUrl = COW_API_URL_BY_CHAIN_ID[chainId];
  const url = `${baseUrl}/api/v1/orders/${orderUid}`;
  return await fetcher<CowOrder>(url);
}
