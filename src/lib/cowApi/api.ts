import {
  arbitrum,
  avalanche,
  base,
  bsc,
  gnosis,
  linea,
  mainnet,
  polygon,
  sepolia,
} from "viem/chains";

import { ChainId, plasma } from "../publicClients";

const COW_API_BASE_URL = "https://api.cow.fi/";

export const COW_API_URL_BY_CHAIN_ID = {
  [mainnet.id]: COW_API_BASE_URL + "mainnet",
  [gnosis.id]: COW_API_BASE_URL + "xdai",
  [sepolia.id]: COW_API_BASE_URL + "sepolia",
  [arbitrum.id]: COW_API_BASE_URL + "arbitrum_one",
  [base.id]: COW_API_BASE_URL + "base",
  [polygon.id]: COW_API_BASE_URL + "polygon",
  [avalanche.id]: COW_API_BASE_URL + "avalanche",
  [bsc.id]: COW_API_BASE_URL + "bnb",
  [linea.id]: COW_API_BASE_URL + "linea",
  [plasma.id]: COW_API_BASE_URL + "plasma",
} satisfies Record<ChainId, string>;
