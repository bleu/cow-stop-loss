import { Badge } from "@bleu-fi/ui";

export function StatusBadge({status}: {status: string | undefined}) {
  switch (status) {
    case "created":
      return (
        <Badge className="text-black bg-yellow hover:bg-yellow/50">
          Created
        </Badge>
      );
    case "posted":
      return <Badge variant="successOutline">Posted</Badge>;
    case "fulfilled":
      return (
        <Badge variant="success" className="bg-green9 hover:bg-green10">
          Fulfilled
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "expired":
      return (
        <Badge className="bg-gray-500 text-white hover:bg-gray-700">
          Expired
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
