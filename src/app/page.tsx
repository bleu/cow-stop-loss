"use client";

import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { StopLossCreation } from "#/components/StopLossCreation";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1540px] p-4 sm:px-6 sm:py-5 lg:flex lg:h-full lg:min-h-0 lg:items-center xl:px-8">
      <div className="grid w-full grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-[minmax(24rem,0.82fr)_minmax(0,1.38fr)] lg:gap-5">
        <section
          aria-labelledby="place-order-title"
          className="relative flex min-w-0 flex-col rounded-[28px] border border-border/80 bg-card p-4 shadow-[0_18px_50px_-36px_rgba(0,0,0,0.75)] sm:p-5 lg:min-h-0 lg:self-start"
        >
          <StopLossCreation />
        </section>
        <section
          aria-labelledby="orders-title"
          className="relative min-h-0 min-w-0 rounded-[28px] border border-border/80 bg-card p-3 shadow-[0_18px_50px_-36px_rgba(0,0,0,0.75)] sm:p-4 lg:min-h-[520px]"
        >
          <div className="flex min-h-0 flex-col gap-2.5 lg:absolute lg:inset-0 lg:p-4">
            <div className="shrink-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                Portfolio
              </p>
              <h2
                id="orders-title"
                className="mt-0.5 text-balance text-xl font-semibold tracking-tight sm:text-2xl"
              >
                Your stop-loss orders
              </h2>
            </div>
            <ConsolidatedOrdersTable />
          </div>
        </section>
      </div>
    </main>
  );
}
