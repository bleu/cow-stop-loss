"use client";

import { Badge } from "@bleu/ui";

import { OrderStatus } from "#/lib/types";

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  switch (status) {
    case "open":
      return (
        <Badge className="text-black bg-highlight hover:bg-highlight/70">
          Open
        </Badge>
      );
    case "fulfilled":
      return (
        <Badge
          color="success"
          className="bg-success hover:bg-success/70 text-foreground"
        >
          Fulfilled
        </Badge>
      );
    case "partiallyFilled":
      return (
        <Badge
          color="success"
          className="bg-success hover:bg-success/70 text-foreground"
        >
          Partially Filled
        </Badge>
      );
    case "canceled":
      return (
        <Badge color="destructive" className="text-foreground">
          Cancelled
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
