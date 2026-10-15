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
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:flex lg:min-h-full lg:flex-col lg:justify-center">
        <p
          role="alert"
          className="rounded-[28px] border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive"
        >
          Unsupported chain: {params.chainId}.
        </p>
      </main>
    );
  if (!address || address.toLowerCase() !== params.safeAddress.toLowerCase()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:flex lg:min-h-full lg:flex-col lg:justify-center">
        <div className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Wallet required
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Connect the order owner
          </h1>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            Connect {params.safeAddress} to view this order.
          </p>
        </div>
      </main>
    );
  }
  return <OrderDetails orderId={params.orderId} chainId={chainId} />;
}
