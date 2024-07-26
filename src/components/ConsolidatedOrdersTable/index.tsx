"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useMemo } from "react";

import { DataTable } from "#/components/data-table/data-table";
import { useCreatingOrders } from "#/hooks/useCreatingOrders";
import { DataTableFilterField, useDataTable } from "#/hooks/useDataTable";
import { useDraftOrders } from "#/hooks/useDraftOrders";
import { useOrderList } from "#/hooks/useOrderList";
import { useQueuedTxs } from "#/hooks/useQueuedOrders";
import {
  CreatingOrder,
  DraftOrder,
  OrderStatus,
  StopLossOrderType,
} from "#/lib/types";

import { DataTableToolbar } from "../data-table/data-table-toolbar";
import { Spinner } from "../ui/spinner";
import { getColumns } from "./columns";
import { ConsolidatedOrdersTableToolbarActions } from "./toolbar-actions";

export type ConsolidatedOrderType =
  | DraftOrder
  | StopLossOrderType
  | CreatingOrder;

export function ConsolidatedOrdersTable() {
  const draftOrders = useDraftOrders((state) => state.draftOrders);
  const { orders, isLoading, mutate: mutateOrderList } = useOrderList();
  const { ordersOnQueue, mutate: mutateQueuedOrders } = useQueuedTxs();
  const [creatingOrders] = useCreatingOrders((state) => [state.creatingOrders]);
  const { safe } = useSafeAppsSDK();

  const allOrders: ConsolidatedOrderType[] = useMemo(
    () => [
      ...creatingOrders,
      ...draftOrders.map(
        (order) => ({ ...order, status: OrderStatus.DRAFT }) as const,
      ),
      ...ordersOnQueue,
      ...orders,
    ],
    [draftOrders, orders, creatingOrders, ordersOnQueue],
  );

  const columns = React.useMemo(
    () => getColumns(),
    [safe.chainId, safe.safeAddress],
  );

  const filterFields: DataTableFilterField<ConsolidatedOrderType>[] = [
    {
      label: "Status",
      value: "status",
      options: [
        { label: "Draft", value: OrderStatus.DRAFT },
        { label: "Queue", value: OrderStatus.ON_QUEUE },
        { label: "Creating", value: OrderStatus.CREATING },
        {
          label: "Open",
          value: OrderStatus.OPEN || OrderStatus.PARTIALLY_FILLED,
        },
        {
          label: "Filled",
          value:
            OrderStatus.FULFILLED || OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
        },
        {
          label: "Partially filled",
          value:
            OrderStatus.PARTIALLY_FILLED ||
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLED ||
            OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
        },
        {
          label: "Cancelled",
          value:
            OrderStatus.CANCELLED || OrderStatus.PARTIALLY_FILLED_AND_CANCELLED,
        },
        {
          label: "Cancelling",
          value:
            OrderStatus.CANCELLING ||
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLING,
        },
        {
          label: "Expired",
          value:
            OrderStatus.EXPIRED || OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
        },
      ],
    },
  ];

  const { table } = useDataTable({
    data: allOrders,
    columns,
    filterFields,
    enableRowSelection: (row) =>
      [
        OrderStatus.DRAFT,
        OrderStatus.OPEN,
        OrderStatus.PARTIALLY_FILLED,
      ].includes(row.original.status),
  });

  return (
    <div>
      <div className="md:-mt-10">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl font-semibold">Your orders</span>
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <button
              onClick={() => {
                mutateQueuedOrders();
                mutateOrderList();
              }}
              className="text-primary hover:text-primary/50 px-1"
            >
              <ReloadIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex rounded-lg bg-muted p-2">
        <DataTable table={table}>
          <DataTableToolbar table={table} filterFields={filterFields}>
            <ConsolidatedOrdersTableToolbarActions table={table} />
          </DataTableToolbar>
        </DataTable>
      </div>
    </div>
  );
}
