"use client";

import { Badge } from "@bleu/ui";

import { OrderStatus } from "#/lib/types";

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  switch (status) {
    case "open":
      return (
        <Badge className="text-black h-fit py-1 bg-highlight hover:bg-highlight/70">
          Open
        </Badge>
      );
    case "fulfilled":
      return (
        <Badge
          color="success"
          className="bg-success h-fit py-1 hover:bg-success/70 "
        >
          Fulfilled
        </Badge>
      );
    case "partiallyFilled":
      return (
        <Badge
          color="success"
          className="bg-success h-fit py-1 hover:bg-success/70 "
        >
          Partially Filled
        </Badge>
      );
    case "canceled":
      return (
        <Badge color="destructive" className="h-fit py-1">
          Cancelled
        </Badge>
      );
    default:
      return <Badge className="h-fit py-1">{status}</Badge>;
  }
}
