"use client";

import {
  Button,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@bleu/ui";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

import { DataTable } from "#/components/data-table/data-table";
import { PixelIcon } from "#/components/ui/pixel-icon";
import { useDataTable } from "#/hooks/useDataTable";
import { useOrderList } from "#/hooks/useOrderList";
import { chainNames } from "#/lib/publicClients";
import { PlacementRow } from "#/lib/stopLossPlacement";

import { getColumns } from "./columns";
import { PortfolioFilterField, PortfolioFilters } from "./filters";

const filterFields: PortfolioFilterField[] = [
  {
    label: "Chain",
    value: "chainId",
    options: Object.entries(chainNames).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    label: "Status",
    value: "status",
    options: [
      "Open",
      "Filled",
      "Canceled",
      "Expired",
      "Partially filled, cancelled",
      "Partially filled, expired",
    ].map((value) => ({ value, label: value })),
  },
];

export type ConsolidatedOrderType = PlacementRow;

export function ConsolidatedOrdersTable() {
  const { address } = useAccount();
  if (!address) return <WalletRequiredOrders />;
  return <ConnectedOrdersTable account={address} />;
}

function OrdersHeading({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rescue-panel-heading rescue-portfolio-heading">
      <div className="rescue-portfolio-title">
        <p className="rescue-eyebrow">Portfolio</p>
        <h2 id="orders-title" className="rescue-panel-title">
          Your stop-loss orders
        </h2>
      </div>
      {children}
    </div>
  );
}

function WalletRequiredOrders() {
  const { openConnectModal } = useConnectModal();
  return (
    <>
      <OrdersHeading />
      <div className="my-auto flex w-full flex-1 items-center justify-center gap-5 px-1 py-5 text-left sm:px-3">
        <div
          aria-hidden="true"
          className="rescue-landing-art hidden size-32 shrink-0 sm:block"
        />
        <div className="max-w-sm">
          <h3 className="font-serif text-2xl leading-tight tracking-tight">
            Your herd, all in one place
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Connect your wallet to see stop-loss orders across supported networks.
          </p>
          <Button
            type="button"
            className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-4 h-11 w-fit rounded-none border border-primary/35 bg-primary/10 px-4 text-[13px] font-medium text-primary hover:bg-primary/15 hover:text-primary"
            onClick={openConnectModal}
          >
            Connect wallet to view orders
          </Button>
        </div>
      </div>
    </>
  );
}

function ConnectedOrdersTable({ account }: { account: Address }) {
  const router = useRouter();
  const { orders, chains, isLoading, mutate, trackingError } = useOrderList();
  const columns = useMemo(() => getColumns(), []);
  const { table } = useDataTable({
    data: orders,
    columns,
    initialColumnVisibility: { chainId: false },
    filterFields,
    defaultSort: "chainId.asc",
    defaultPerPage: 5,
    enableRowSelection: false,
  });

  const isInitialLoading = isLoading && !chains.length && !orders.length;
  const hasAvailableOrders =
    orders.length > 0 || chains.some((chain) => chain.status === "success");
  const emptyMessage = isInitialLoading ? (
    <p role="status">Loading stop-loss orders...</p>
  ) : hasAvailableOrders ? (
    "No results."
  ) : (
    "Orders are unavailable on all supported chains."
  );

  const failedChains = chains.filter((chain) => chain.status === "error");
  const warnings = (trackingError || failedChains.length > 0) && (
    <div className="space-y-2 text-left">
      {trackingError && (
        <p>Placement tracking is unavailable. {trackingError}</p>
      )}
      {failedChains.map((chain) => (
        <div key={chain.chainId}>
          <p>{chainNames[chain.chainId]} orders are unavailable.</p>
          <p>{chain.error}</p>
          {chain.orders.length > 0 && (
            <p>
              Previously loaded {chainNames[chain.chainId]} orders may be out of
              date.
            </p>
          )}
        </div>
      ))}
      <p>Use Refresh orders to retry.</p>
    </div>
  );

  return (
    <>
      <OrdersHeading>
        <PortfolioFilters table={table} filterFields={filterFields}>
          <TooltipProvider>
            {warnings && (
              <TooltipRoot delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Order availability warnings"
                    className="rescue-secondary-control pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring size-11 shrink-0 rounded-none lg:size-7 lg:min-h-7 lg:min-w-7 text-warning hover:text-warning"
                  >
                    <PixelIcon name="warning" className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  collisionPadding={12}
                  className="rescue-info-tooltip pixel-frame rounded-none text-popover-foreground"
                >
                  {warnings}
                </TooltipContent>
              </TooltipRoot>
            )}
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rescue-secondary-control pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring size-11 shrink-0 rounded-none lg:size-7 lg:min-h-7 lg:min-w-7 text-muted-foreground hover:text-primary"
                  aria-label="Refresh orders"
                  aria-busy={isLoading}
                  disabled={isLoading}
                  onClick={() => mutate()}
                >
                  <PixelIcon
                    name="reload"
                    className={`size-4 ${isLoading ? "motion-safe:animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh orders</TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
        </PortfolioFilters>
      </OrdersHeading>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <DataTable
          table={table}
          fillPanel
          className="rescue-orders-table"
          tableClassName="min-w-0 table-fixed xl:min-w-0"
          onRowClick={(row: PlacementRow) => {
            if (row.canLink)
              router.push(
                `/${row.chainId}/${account}/${encodeURIComponent(row.parentId)}`,
              );
          }}
          getRowLabel={(row: PlacementRow) =>
            row.canLink
              ? `View order ${row.parentId} on ${chainNames[row.chainId]}`
              : undefined
          }
          emptyMessage={emptyMessage}
        />
      </div>
    </>
  );
}
