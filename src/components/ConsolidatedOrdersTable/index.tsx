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
import { StopLossOrder } from "#/lib/stopLossOrders";

import { stopLossStatusLabels } from "../StatusBadge";
import { getColumns } from "./columns";

const filterFields: DataTableFilterField<StopLossOrder>[] = [
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
    options: Object.entries(stopLossStatusLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
];

export type ConsolidatedOrderType = StopLossOrder;

export function ConsolidatedOrdersTable() {
  const { address } = useAccount();
  const { orders, chains, isLoading, mutate } = useOrderList();
  const columns = useMemo(() => getColumns(address!), [address]);
  const { table } = useDataTable({
    data: orders,
    columns,
    filterFields,
    defaultSort: "chainId.asc",
    enableRowSelection: false,
  });

  if (isLoading && !chains.length)
    return <p role="status">Loading stop-loss orders...</p>;

  return (
    <>
      {chains
        .filter((chain) => chain.status === "error")
        .map((chain) => (
          <div
            key={chain.chainId}
            role="alert"
            className="mb-4 rounded border border-destructive p-3"
          >
            <p>{chainNames[chain.chainId]} orders are unavailable.</p>
            <p>{chain.error}</p>
            {chain.orders.length > 0 && (
              <p>
                Previously loaded {chainNames[chain.chainId]} orders may be out
                of date.
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
      {orders.length > 0 ||
      chains.some((chain) => chain.status === "success") ? (
        <DataTable table={table}>
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
      ) : (
        <p>Orders are unavailable on all supported chains.</p>
      )}
    </>
  );
}
