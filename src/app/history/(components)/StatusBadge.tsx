import { Badge } from "@bleu-fi/ui";

export function StatusBadge({ status }: { status: string | undefined }) {
  switch (status) {
    case "created":
      return (
        <Badge className="text-black bg-highlight hover:bg-highlight/70">
          Waiting condition
        </Badge>
      );
    case "posted":
      return <Badge variant="successOutline">Posted</Badge>;
    case "fulfilled":
      return (
        <Badge variant="success" className="bg-success hover:bg-success/70">
          Fulfilled
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "expired":
      return (
        <Badge className="bg-info text-white hover:bg-info/70">Expired</Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
