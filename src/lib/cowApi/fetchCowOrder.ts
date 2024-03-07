import { Address } from "viem";
import { ChainId } from "../publicClients";
import { COW_API_URL_BY_CHAIN_ID } from "./api";

export async function getCowOrders(
    userAddress: Address,
    chainId: ChainId,
  ) {
    const url = COW_API_URL_BY_CHAIN_ID[chainId];
  
    return fetch(`${url}/api/v1/account/${userAddress}/orders`, {
      headers: {
        Accept: "application/json",
      },
    }).then((response) => response.json());
  }
  