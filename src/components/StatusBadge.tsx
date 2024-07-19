"use client";

import { Badge, capitalize } from "@bleu/ui";

import { OrderStatus } from "#/lib/types";

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  switch (status) {
    case "open":
      return (
        <Badge className="text-black h-fit py-1 bg-highlight hover:bg-highlight">
          Open
        </Badge>
      );
    case "filled":
      return (
        <Badge
          color="success"
          className="bg-success h-fit py-1 hover:bg-success "
        >
          Filled
        </Badge>
      );
    case "partiallyFilled":
      return (
        <Badge
          color="success"
          className="bg-success h-fit py-1 hover:bg-success "
        >
          Partially Filled
        </Badge>
      );
    case "cancelled":
      return (
        <Badge color="destructive" className="h-fit py-1 hover:bg-destructive">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge className="h-fit py-1 hover:bg-primary bg-primary ">
          {status && capitalize(status)}
        </Badge>
      );
  }
}
