"use client";

import { formatNumber } from "@bleu/ui";
import useSWR from "swr";
import { Address, formatUnits } from "viem";

import { oracleMinimalAbi } from "#/lib/abis/oracleMinimalAbi";
import { ChainId, publicClientsFromIds } from "#/lib/publicClients";

async function loadOraclePrice({
  chainId,
  oracle,
}: {
  chainId: ChainId;
  oracle: Address;
}) {
  const client = publicClientsFromIds[chainId];
  const [round, decimals] = await Promise.all([
    client.readContract({
      address: oracle,
      abi: oracleMinimalAbi,
      functionName: "latestRoundData",
    }) as Promise<readonly [bigint, bigint, bigint, bigint, bigint]>,
    client.readContract({
      address: oracle,
      abi: oracleMinimalAbi,
      functionName: "decimals",
    }) as Promise<number>,
  ]);
  const price = Number(formatUnits(round[1], decimals));
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Oracle price is unavailable");
  }
  return price;
}

export function OracleTokenPrice({
  chainId,
  oracle,
  tokenSymbol,
}: {
  chainId: ChainId;
  oracle: Address;
  tokenSymbol: string;
}) {
  const { data, error, isLoading } = useSWR(
    ["oracleTokenPrice", chainId, oracle],
    () => loadOraclePrice({ chainId, oracle }),
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );

  return (
    <p className="mt-1 text-[13px] font-normal text-muted-foreground">
      Current price:{" "}
      {data
        ? `${formatNumber(data, 2, "currency", "standard")} per ${tokenSymbol}`
        : isLoading
          ? "Loading…"
          : error
            ? "Unavailable"
            : "—"}
    </p>
  );
}
