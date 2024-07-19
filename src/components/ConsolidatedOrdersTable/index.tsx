"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useMemo } from "react";

import { DataTable } from "#/components/data-table/data-table";
import { DataTableFilterField, useDataTable } from "#/hooks/useDataTable";
import { useDraftOrders } from "#/hooks/useDraftOrders";
import { useOrderList } from "#/hooks/useOrderList";
import { useTxManager } from "#/hooks/useTxManager";
import { DraftOrder, StopLossOrderType } from "#/lib/types";

import { DataTableToolbar } from "../data-table/data-table-toolbar";
import { Spinner } from "../ui/spinner";
import { getColumns } from "./columns";
import { ConsolidatedOrdersTableToolbarActions } from "./toolbar-actions";

export type ConsolidatedOrderType = DraftOrder | StopLossOrderType;

export function ConsolidatedOrdersTable() {
  const { isPonderUpdating } = useTxManager();

  const draftOrders = useDraftOrders((state) => state.draftOrders);
  const { orders, isLoading, mutate } = useOrderList();
  const { safe } = useSafeAppsSDK();

  const allOrders: ConsolidatedOrderType[] = useMemo(
    () => [
      ...draftOrders.map((order) => ({ ...order, status: "draft" }) as const),
      ...orders,
    ],
    [draftOrders, orders],
  );

  const columns = React.useMemo(
    () => getColumns(),
    [safe.chainId, safe.safeAddress],
  );
  const isUpdating = isLoading || isPonderUpdating;

  const filterFields: DataTableFilterField<ConsolidatedOrderType>[] = [
    {
      label: "Status",
      value: "status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Open", value: "open" },
        { label: "Filled", value: "filled" },
        { label: "Partially filled", value: "partiallyFilled" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
  ];

  const { table } = useDataTable({
    data: allOrders,
    columns,
    filterFields,
    enableRowSelection: (row) =>
      row.original.status !== "filled" && row.original.status !== "cancelled",
  });

  return (
    <div>
      <div className="md:-mt-10">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl font-semibold ">Your orders</span>
          {isUpdating ? (
            <Spinner size="sm" />
          ) : (
            <button
              onClick={() => {
                mutate();
              }}
              className="text-primary hover:text-primary/50 px-1"
            >
              <ReloadIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex rounded-lg bg-muted p-2 max-h-[80vh]">
        <DataTable table={table}>
          <DataTableToolbar table={table} filterFields={filterFields}>
            <ConsolidatedOrdersTableToolbarActions table={table} />
          </DataTableToolbar>
        </DataTable>
      </div>
    </div>
  );
}
