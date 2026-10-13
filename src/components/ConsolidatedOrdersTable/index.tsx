"use client";

import {
  Button,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@bleu/ui";
import { ReloadIcon } from "@radix-ui/react-icons";
import React, { useMemo } from "react";
import { useAccount } from "wagmi";

import { DataTable } from "#/components/data-table/data-table";
import { DataTableToolbar } from "#/components/data-table/data-table-toolbar";
import { DataTableFilterField, useDataTable } from "#/hooks/useDataTable";
import { useOrderList } from "#/hooks/useOrderList";
import { chainNames } from "#/lib/publicClients";
import { PlacementRow } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";

import { stopLossStatusLabels } from "../StatusBadge";
import { getColumns } from "./columns";

const filterFields: DataTableFilterField<PlacementRow>[] = [
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
    options: Object.entries({
      ...stopLossStatusLabels,
      [OrderStatus.CREATING]: "Pending",
    }).map(([value, label]) => ({
      value,
      label,
    })),
  },
];

export type ConsolidatedOrderType = PlacementRow;

export function ConsolidatedOrdersTable() {
  const { address } = useAccount();
  const { orders, chains, isLoading, mutate, trackingError } = useOrderList();
  const columns = useMemo(() => getColumns(address!), [address]);
  const { table } = useDataTable({
    data: orders,
    columns,
    filterFields,
    defaultSort: "chainId.asc",
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
  const notice = (trackingError || failedChains.length > 0) && (
    <div className="space-y-4 text-left">
      {trackingError && (
        <p role="alert" className="rounded border border-destructive p-3">
          Placement tracking is unavailable. {trackingError}
        </p>
      )}
      {failedChains.map((chain) => (
        <div
          key={chain.chainId}
          role="alert"
          className="rounded border border-destructive p-3"
        >
          <p>{chainNames[chain.chainId]} orders are unavailable.</p>
          <p>{chain.error}</p>
          {chain.orders.length > 0 && (
            <p>
              Previously loaded {chainNames[chain.chainId]} orders may be out of
              date.
            </p>
          )}
          <button
            disabled={isLoading}
            onClick={() => mutate()}
            className="text-primary underline"
          >
            Retry {chainNames[chain.chainId]}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <DataTable
        table={table}
        fillPanel
        emptyMessage={emptyMessage}
        notice={notice}
      >
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          afterFilters={
            <TooltipProvider>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 rounded-lg border-foreground/15 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-primary"
                    aria-label="Refresh orders"
                    aria-busy={isLoading}
                    disabled={isLoading}
                    onClick={() => mutate()}
                  >
                    <ReloadIcon
                      aria-hidden="true"
                      className={`size-4 ${isLoading ? "motion-safe:animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh orders</TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          }
        />
      </DataTable>
    </div>
  );
}
