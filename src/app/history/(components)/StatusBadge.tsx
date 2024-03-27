import { Badge } from "@bleu-fi/ui";

export function StatusBadge(status: string | undefined){
    switch (status) {
    case "created":
      return <Badge className="border-yellow text-yellow bg-transparent" >Created</Badge>;
    case "posted":
      return <Badge variant="successOutline">Posted</Badge>;
    case "fulfilled":
      return <Badge variant="success" className="bg-green9">Fulfilled</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
      case "expired":
        return <Badge className="bg-gray-500 text-white">Expired</Badge>;
    default:
      return <Badge>{status}</Badge>;
    }
  }