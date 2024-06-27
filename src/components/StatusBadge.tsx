import { Badge } from "@bleu/ui";

export function StatusBadge({ status }: { status: string | undefined }) {
  switch (status) {
    case "created":
      return (
        <Badge className="text-black bg-highlight hover:bg-highlight/70">
          Waiting condition
        </Badge>
      );
    case "posted":
      return <Badge color="successOutline">Posted</Badge>;
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
    case "cancelled":
      return (
        <Badge color="destructive" className="text-foreground">
          Cancelled
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
