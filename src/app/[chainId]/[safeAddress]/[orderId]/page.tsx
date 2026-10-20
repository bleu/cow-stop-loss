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
      <main className="rescue-detail-page mx-auto w-full px-4 py-8 sm:px-6 sm:py-10 lg:flex lg:min-h-full lg:flex-col lg:justify-center">
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
      <main className="rescue-detail-page mx-auto w-full px-4 py-8 sm:px-6 sm:py-10 lg:flex lg:min-h-full lg:flex-col lg:justify-center">
        <div className="rescue-panel rounded-[24px] border border-border/70 bg-card p-6 shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Wallet required
          </p>
          <h1 className="mt-2 font-serif text-[32px] leading-tight tracking-tight">
            Connect the order owner
          </h1>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            Connect {params.safeAddress} to view this order.
          </p>
        </div>
      </main>
    );
  }
  let orderId = params.orderId;
  try {
    orderId = decodeURIComponent(orderId);
  } catch {
    // Keep malformed escape sequences so the page can show an unknown order.
  }
  return <OrderDetails orderId={orderId} chainId={chainId} />;
}
