import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Address, formatUnits } from "viem";

import { chainNames } from "#/lib/publicClients";
import { PlacementRecord, PlacementRow } from "#/lib/stopLossPlacement";

import { StatusBadge } from "../StatusBadge";

function placementLabel({ stage, status }: PlacementRecord) {
  const stageLabel = {
    "approval-reset": "Approval reset",
    approval: "Approval",
    setup: "Setup",
  }[stage];
  if (status === "confirmed") return "Waiting for API indexing";
  if (status === "prompting")
    return `Waiting for wallet: ${stageLabel.toLowerCase()}`;
  if (status === "ready")
    return stage === "approval-reset"
      ? "Approval reset confirmed. Approval required."
      : "Approval confirmed. Ready to place.";
  return `${stageLabel} pending`;
}

export function getColumns(account: Address): ColumnDef<PlacementRow>[] {
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
      cell: ({ row: { original: order } }) =>
        order.source === "local" && order.placement.status !== "confirmed" ? (
          <span>Pending</span>
        ) : (
          <StatusBadge status={order.status} />
        ),
      filterFn: (row, id, values: string[]) =>
        values.includes(row.getValue(id)),
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row: { original: order } }) =>
        order.canLink ? (
          <Link
            href={`/${order.chainId}/${account}/${encodeURIComponent(order.parentId)}`}
            aria-label={`View order ${order.parentId} on ${chainNames[order.chainId]}`}
          >
            View details
          </Link>
        ) : (
          <div>
            <p>{placementLabel(order.placement)}</p>
            {order.error && (
              <p role="alert" className="text-destructive">
                {order.error}
              </p>
            )}
          </div>
        ),
    },
  ];
}
