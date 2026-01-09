// @ts-ignore
import parsePrometeusText from "parse-prometheus-text-format";

import { networkFor } from "#/utils";
import { NEXT_PUBLIC_API_URL } from ".";
interface ChainStatus {
  id: number;
  block: {
    number: number;
    timestamp: number;
  };
}

interface StatusResponse {
  mainnet: ChainStatus;
  arbitrum: ChainStatus;
  gnosis: ChainStatus;
  sepolia: ChainStatus;
  // Accept any chain string key here in addition to explicit mainnet/arbitrum/etc fields
  [key: string]: ChainStatus;
}

export async function getBlockNumberFromStatus({
  chainId,
}: {
  chainId: number;
}) {
  const response = await fetch(NEXT_PUBLIC_API_URL + "/status").then((res) =>
    res.json()
  );
  const status = response.data as StatusResponse;
  if (!status) return;

  const chainStatus = status[networkFor(chainId)];

  if (!chainStatus) return;
  return Number(chainStatus.block.number);
}
