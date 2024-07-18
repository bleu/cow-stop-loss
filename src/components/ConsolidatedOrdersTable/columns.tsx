import { Checkbox, formatNumber } from "@bleu/ui";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { formatUnits } from "viem";

import { DataTableColumnHeader } from "#/components/data-table/data-table-column-header";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { getOrderDescription } from "#/lib/orderDescription";

import { StatusBadge } from "../StatusBadge";
import { ConsolidatedOrderType } from ".";

export function getColumns(): ColumnDef<ConsolidatedOrderType>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "blockTimestamp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        if (!row.original.blockTimestamp) {
          return "N/A";
        }
        const timestamp = Number(row.original.blockTimestamp);
        return new Date(timestamp * 1000).toLocaleString();
      },
    },
    {
      accessorKey: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => {
        const order = row.original;
        if ("stopLossData" in order) {
          const stopLossData = order.stopLossData;
          if (!stopLossData) return null;

          return (
            <div className="flex flex-col">
              <span>{stopLossData.isSellOrder ? "Sell" : "Buy"} Order</span>
              <span>
                {formatNumber(
                  formatUnits(
                    stopLossData.tokenAmountIn,
                    stopLossData.tokenIn.decimals,
                  ),
                  4,
                )}{" "}
                {stopLossData.tokenIn.symbol} to{" "}
                {formatNumber(
                  formatUnits(
                    stopLossData.tokenAmountOut,
                    stopLossData.tokenOut.decimals,
                  ),
                  4,
                )}{" "}
                {stopLossData.tokenOut.symbol}
              </span>
            </div>
          );
        } else {
          return getOrderDescription(order);
        }
      },
    },
    {
      accessorKey: "strikePrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trigger price" />
      ),
      cell: ({ row }) => {
        const order = row.original;
        if (order?.stopLossData) {
          const stopLossData = order.stopLossData;
          return `${formatNumber(formatUnits(stopLossData.strike, 18), 4)} ${stopLossData.tokenOut.symbol}/${stopLossData.tokenIn.symbol}`;
        } else {
          return `${formatNumber(order.strikePrice, 4)} ${order.tokenBuy.symbol}/${order.tokenSell.symbol}`;
        }
      },
    },
    {
      accessorKey: "limitPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Limit price" />
      ),
      cell: ({ row }) => {
        const order = row.original;
        if ("limitPrice" in order) {
          return `${formatNumber(order.limitPrice, 4)} ${order.tokenBuy.symbol}/${order.tokenSell.symbol}`;
        }
        return "N/A";
      },
    },
    {
      accessorKey: "currentPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Current price" />
      ),
      cell: ({ row }) => {
        const order = row.original;
        const { data: marketPrice } = useTokenPairPrice(
          "stopLossData" in order
            ? order.stopLossData.tokenIn
            : order.tokenSell,
          "stopLossData" in order
            ? order.stopLossData.tokenOut
            : order.tokenBuy,
        );
        if (marketPrice) {
          return `${formatNumber(marketPrice, 4)} ${
            "stopLossData" in order
              ? `${order.stopLossData.tokenOut.symbol}/${order.stopLossData.tokenIn.symbol}`
              : `${order.tokenBuy.symbol}/${order.tokenSell.symbol}`
          }`;
        }
        return "Loading...";
      },
    },
    {
      accessorKey: "filledPct",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Filled" />
      ),
      cell: ({ row }) => {
        if ("filledPct" in row.original) {
          return `${((row.original.filledPct || 0) * 100).toFixed()}%`;
        }
        return "N/A";
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        if ("status" in row.original) {
          return <StatusBadge status={row.original.status} />;
        }
        return "Draft";
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
  ];
}
