"use client";

import { type CSSProperties, useRef, useState } from "react";

import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { StopLossCreation } from "#/components/StopLossCreation";

export default function Page() {
  const portfolioRef = useRef<HTMLElement>(null);
  const [reviewTableHeight, setReviewTableHeight] = useState<number>();

  return (
    <main id="main-content" className="air-rescue-page relative isolate w-full">
      <div className="rescue-home-content">
        <h1 className="sr-only">CoW Air Rescue</h1>
        <div className="rescue-hero-cow" aria-hidden="true" />
        <div
          className="rescue-home-cards"
          style={
            {
              "--rescue-review-table-height": reviewTableHeight
                ? `${reviewTableHeight}px`
                : undefined,
            } as CSSProperties
          }
        >
          <section
            aria-label="Create stop-loss order"
            className="rescue-panel rescue-create-panel"
          >
            <div className="rescue-distant-cow" aria-hidden="true" />
            <StopLossCreation
              onReview={() => {
                setReviewTableHeight(
                  portfolioRef.current?.getBoundingClientRect().height,
                );
              }}
            />
          </section>
          <section
            ref={portfolioRef}
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
