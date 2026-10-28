import { type Address } from "viem";
import { z } from "zod";

import { composableCowPollerAbi } from "../abis/composableCowPoller";
import { cowShedFactoryAbi } from "../abis/cowShedFactory";
import { POLLER_ADDRESS_BY_CHAIN_ID } from "../contracts";
import { type ChainId, publicClientsFromIds } from "../publicClients";
import { COW_API_URL_BY_CHAIN_ID } from "./api";

const quoteSchema = z.object({
  quote: z.object({ buyAmount: z.string().regex(/^[1-9]\d*$/) }),
});

export async function fetchSellQuote({
  chainId,
  account,
  sellToken,
  buyToken,
  sellAmount,
}: {
  chainId: ChainId;
  account: Address;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
}) {
  const client = publicClientsFromIds[chainId];
  const factory = await client.readContract({
    address: POLLER_ADDRESS_BY_CHAIN_ID[chainId],
    abi: composableCowPollerAbi,
    functionName: "COW_SHED_FACTORY",
  });
  const owner = await client.readContract({
    address: factory,
    abi: cowShedFactoryAbi,
    functionName: "proxyOf",
    args: [account],
  });
  const response = await fetch(
    `${COW_API_URL_BY_CHAIN_ID[chainId]}/api/v1/quote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellToken,
        buyToken,
        from: owner,
        kind: "sell",
        sellAmountBeforeFee: sellAmount,
        priceQuality: "fast",
        signingScheme: "eip1271",
      }),
    },
  );
  if (!response.ok) {
    const error = z
      .object({ errorType: z.string() })
      .safeParse(await response.json().catch(() => undefined));
    if (error.success && error.data.errorType === "SellAmountDoesNotCoverFee") {
      throw new Error(
        "The sell amount does not cover current estimated fees. This order might not execute.",
      );
    }
    throw new Error(
      "A current execution quote is unavailable. This order might not execute.",
    );
  }
  return BigInt(quoteSchema.parse(await response.json()).quote.buyAmount);
}

// Pair recommendation helper; disabled for order creation, which uses fixed slippage.
export async function fetchPairSlippage(
  chainId: ChainId,
  sellToken: Address,
  buyToken: Address,
) {
  const response = await fetch(
    `https://bff.cow.fi/${chainId}/markets/${sellToken}-${buyToken}/slippageTolerance`,
  );
  if (!response.ok) throw new Error("Pair slippage unavailable");
  return z
    .object({ slippageBps: z.number().int().nonnegative().safe() })
    .parse(await response.json()).slippageBps;
}
