"use client";

import { useAccount } from "wagmi";

import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";

export default function Page() {
  const { address } = useAccount();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Your stop-loss orders</h1>
      {address ? (
        <ConsolidatedOrdersTable />
      ) : (
        <p>Connect a wallet to view your stop-loss orders.</p>
      )}
    </main>
  );
}
