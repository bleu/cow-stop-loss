import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Address, formatUnits } from "viem";

import { chainNames } from "#/lib/publicClients";
import { StopLossOrder } from "#/lib/stopLossOrders";

import { StatusBadge } from "../StatusBadge";

export function getColumns(account: Address): ColumnDef<StopLossOrder>[] {
  return [
    {
      id: "order",
      header: "Order",
      cell: ({ row: { original: order } }) => (
        <span>
          {order.sellToken.decimals === null
            ? `${order.sellAmount} base units`
            : formatUnits(order.sellAmount, order.sellToken.decimals)}{" "}
          {order.sellToken.symbol}
          {" for "}
          {order.buyToken.decimals === null
            ? `${order.buyAmount} base units`
            : formatUnits(order.buyAmount, order.buyToken.decimals)}{" "}
          {order.buyToken.symbol}
        </span>
      ),
    },
    {
      accessorKey: "chainId",
      header: "Chain",
      cell: ({ row }) => chainNames[row.original.chainId],
      filterFn: (row, id, values: string[]) =>
        values.includes(String(row.getValue(id))),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: (row, id, values: string[]) =>
        values.includes(row.getValue(id)),
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row: { original: order } }) => (
        <Link
          href={`/${order.chainId}/${account}/${encodeURIComponent(order.parentId)}`}
          aria-label={`View order ${order.parentId} on ${chainNames[order.chainId]}`}
        >
          View details
        </Link>
      ),
    },
  ];
}
