"use client";

import { useAccount } from "wagmi";

import { OrderDetails } from "#/components/OrderDetails";
import { ChainId, supportedChainIds } from "#/lib/publicClients";

export default function OrderPage({
  params,
}: {
  params: { safeAddress: string; chainId: string | number; orderId: string };
}) {
  const { address } = useAccount();
  const chainId = Number(params.chainId) as ChainId;
  if (!supportedChainIds.includes(chainId))
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p role="alert">Unsupported chain: {params.chainId}.</p>
      </main>
    );
  if (!address || address.toLowerCase() !== params.safeAddress.toLowerCase()) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p>Connect {params.safeAddress} to view this order.</p>
      </main>
    );
  }
  return <OrderDetails orderId={params.orderId} chainId={chainId} />;
}
