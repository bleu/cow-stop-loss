"use client";

import { Address } from "viem";

import { useOraclePrice } from "#/hooks/useOraclePrice";
import { ChainId } from "#/lib/publicClients";
import { formatFiatAmount } from "#/utils/amountFormatting";

export function OracleTokenPrice({
  chainId,
  oracle,
  tokenSymbol,
}: {
  chainId: ChainId;
  oracle: Address;
  tokenSymbol: string;
}) {
  const { data } = useOraclePrice(chainId, oracle);
  if (!data) return null;

  return (
    <p
      title={`$${data} per ${tokenSymbol}`}
      className="mt-1 text-[13px] font-normal text-muted-foreground"
    >
      Current price: ${formatFiatAmount(data)} per {tokenSymbol}
    </p>
  );
}
