"use client";

import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { StopLossCreation } from "#/components/StopLossCreation";

export default function Page() {
  return (
    <main className="air-rescue-page relative isolate min-h-full w-full px-4 pb-20 pt-5 sm:px-6 min-[860px]:h-full min-[860px]:min-h-0 min-[860px]:px-6 min-[860px]:py-0">
      <div className="rescue-home-content relative mx-auto w-full max-w-[1200px] min-[860px]:grid min-[860px]:h-full min-[860px]:min-h-0 min-[860px]:grid-rows-[minmax(0,1fr)_minmax(0,482px)_minmax(0,1fr)]">
        <header className="rescue-home-heading mb-5 flex min-h-24 items-center justify-between gap-6 min-[860px]:mb-0 min-[860px]:min-h-0">
          <div>
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground min-[860px]:hidden">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-secondary"
              />
              CoW Air Rescue
            </p>
            <p className="font-serif text-4xl leading-[1.08] tracking-tight text-foreground sm:text-[40px]">
              A plan for <em className="text-primary">the way down.</em>
            </p>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground sm:max-w-none sm:text-sm">
              Give your tokens a parachute. Be ready for the downs.
            </p>
          </div>
        </header>
        <div className="rescue-home-cards grid w-full grid-cols-1 items-start gap-5 min-[860px]:grid-cols-[minmax(0,min(480px,52%))_minmax(0,1fr)] min-[860px]:h-full min-[860px]:min-h-0 min-[860px]:items-stretch min-[860px]:gap-4">
          <section
            aria-label="Create stop-loss order"
            className="rescue-panel rescue-create-panel relative flex min-w-0 flex-col overflow-x-hidden overflow-y-auto rounded-[24px] border border-border bg-card p-4 sm:p-6 min-[860px]:max-h-full min-[860px]:self-stretch min-[860px]:p-4"
          >
            <StopLossCreation />
          </section>
          <section
            aria-labelledby="orders-title"
            className="rescue-panel rescue-portfolio-panel relative flex h-[390px] min-w-0 flex-col sm:h-[320px] min-[860px]:h-full overflow-hidden rounded-[24px] border border-border bg-card p-4 sm:p-6 min-[860px]:min-h-0 min-[860px]:p-4"
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 min-[860px]:absolute min-[860px]:inset-0 min-[860px]:p-4">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                    Portfolio
                  </p>
                  <h2
                    id="orders-title"
                    className="mt-2 text-balance font-serif text-[28px] leading-tight tracking-tight sm:text-[32px]"
                  >
                    Your stop-loss orders
                  </h2>
                </div>
              </div>
              <ConsolidatedOrdersTable />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
