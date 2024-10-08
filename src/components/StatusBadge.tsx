"use client";

import { Badge, capitalize } from "@bleu/ui";

import { OrderStatus } from "#/lib/types";

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  switch (status) {
    case OrderStatus.OPEN:
      return (
        <Badge className="text-black h-fit py-1 bg-highlight hover:bg-highlight">
          Open
        </Badge>
      );
    case OrderStatus.FULFILLED:
      return (
        <Badge
          color="success"
          className="bg-success h-fit py-1 hover:bg-success "
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
          className="bg-success h-fit py-1 hover:bg-success "
        >
          Partially Filled
        </Badge>
      );
    case OrderStatus.PARTIALLY_FILLED_AND_CANCELLING:
      return (
        <Badge
          color="destructive"
          className="bg-destructive h-fit py-1 hover:bg-destructive"
        >
          Cancelling
        </Badge>
      );
    case OrderStatus.CANCELLED:
    case OrderStatus.EXPIRED:
    case OrderStatus.CANCELLING:
      return (
        <Badge color="destructive" className="h-fit py-1 hover:bg-destructive">
          {capitalize(status)}
        </Badge>
      );
    default:
      return (
        <Badge className="h-fit py-1 hover:bg-primary bg-primary ">
          {capitalize(status)}
        </Badge>
      );
  }
}
