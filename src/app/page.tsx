"use client";

import { useAccount } from "wagmi";

import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { StopLossCreation } from "#/components/StopLossCreation";

export default function Page() {
  const { address } = useAccount();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {address ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="place-order-title"
            className="min-w-0 rounded-lg border p-4"
          >
            <h1 id="place-order-title" className="mb-4 text-2xl font-semibold">
              Place a stop-loss order
            </h1>
            <StopLossCreation />
          </section>
          <section
            aria-labelledby="orders-title"
            className="relative min-h-0 min-w-0 rounded-lg border"
          >
            <div className="flex min-h-0 flex-col p-4 lg:absolute lg:inset-0">
              <h2
                id="orders-title"
                className="mb-4 shrink-0 text-2xl font-semibold"
              >
                Your stop-loss orders
              </h2>
              <ConsolidatedOrdersTable />
            </div>
          </section>
        </div>
      ) : (
        <>
          <h1 className="mb-4 text-2xl font-semibold">Your stop-loss orders</h1>
          <p>Connect a wallet to view your stop-loss orders.</p>
        </>
      )}
    </main>
  );
}
