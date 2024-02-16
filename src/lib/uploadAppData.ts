import { gnosis, mainnet, sepolia } from "viem/chains";
import { ChainId } from "./publicClients";

const COW_API_BASE_URL = "https://api.cow.fi/";

export const COW_API_URL_BY_CHAIN_ID = {
  [mainnet.id]: COW_API_BASE_URL + "mainnet",
  [gnosis.id]: COW_API_BASE_URL + "xdai",
  [sepolia.id]: COW_API_BASE_URL + "sepolia",
};

export async function uploadAppData({
  appDataHex,
  fullAppData,
  chainId,
}: {
  appDataHex: string;
  fullAppData: string;
  chainId: ChainId;
}) {
  const url = COW_API_URL_BY_CHAIN_ID[chainId];

  return fetch(`${url}/api/v1/app_data/${appDataHex}`, {
    method: "PUT",
    body: JSON.stringify({ fullAppData }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((response) => response.json());
}
