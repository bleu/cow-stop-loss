"use client";

import { Badge, capitalize } from "@bleu/ui";

import { OrderStatus } from "#/lib/types";

export const stopLossStatusLabels = {
  [OrderStatus.OPEN]: "Open",
  [OrderStatus.FULFILLED]: "Filled",
  [OrderStatus.CANCELLED]: "Cancelled",
  [OrderStatus.EXPIRED]: "Expired",
  [OrderStatus.PARTIALLY_FILLED]: "Partially filled",
  [OrderStatus.PARTIALLY_FILLED_AND_CANCELLED]: "Partially filled, cancelled",
  [OrderStatus.PARTIALLY_FILLED_AND_EXPIRED]: "Partially filled, expired",
};

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  switch (status) {
    case OrderStatus.OPEN:
      return (
        <Badge className="h-fit rounded-full border border-highlight/30 bg-highlight px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-black shadow-sm hover:bg-highlight">
          Open
        </Badge>
      );
    case OrderStatus.FULFILLED:
      return (
        <Badge
          color="success"
          className="h-fit rounded-full border border-success/30 bg-success px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm hover:bg-success"
        >
          Filled
        </Badge>
      );
    case OrderStatus.PARTIALLY_FILLED:
    case OrderStatus.PARTIALLY_FILLED_AND_CANCELLED:
    case OrderStatus.PARTIALLY_FILLED_AND_EXPIRED:
      return (
        <Badge
          color="success"
          className="h-fit rounded-full border border-success/30 bg-success px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm hover:bg-success"
        >
          {stopLossStatusLabels[status]}
        </Badge>
      );
    case OrderStatus.PARTIALLY_FILLED_AND_CANCELLING:
      return (
        <Badge
          color="destructive"
          className="h-fit rounded-full border border-destructive/30 bg-destructive px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-destructive-foreground shadow-sm hover:bg-destructive"
        >
          Cancelling
        </Badge>
      );
    case OrderStatus.CANCELLED:
    case OrderStatus.EXPIRED:
    case OrderStatus.CANCELLING:
      return (
        <Badge
          color="destructive"
          className="h-fit rounded-full border border-destructive/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm hover:bg-destructive"
        >
          {capitalize(status)}
        </Badge>
      );
    default:
      return (
        <Badge className="h-fit rounded-full border border-primary/30 bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm hover:bg-primary">
          {capitalize(status)}
        </Badge>
      );
  }
}
