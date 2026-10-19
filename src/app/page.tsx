"use client";

import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { StopLossCreation } from "#/components/StopLossCreation";

export default function Page() {
  return (
    <main id="main-content" className="air-rescue-page relative isolate w-full">
      <div className="rescue-home-content">
        <h1 className="sr-only">CoW Air Rescue</h1>
        <div className="rescue-hero-cow" aria-hidden="true" />
        <div className="rescue-home-cards">
          <section
            aria-label="Create stop-loss order"
            className="rescue-panel rescue-create-panel"
          >
            <div className="rescue-distant-cow" aria-hidden="true" />
            <StopLossCreation />
          </section>
          <section
            aria-labelledby="orders-title"
            className="rescue-panel rescue-portfolio-panel"
          >
            <div className="rescue-portfolio-content">
              <ConsolidatedOrdersTable />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
