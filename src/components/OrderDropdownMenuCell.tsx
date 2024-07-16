"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  TableCell,
} from "@bleu/ui";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";

export function OrderDropdownMenuCell({
  orderId,
  invertedPrice,
  setInvertedPrice,
  showDetails = true,
}: {
  orderId: string;
  invertedPrice: boolean;
  setInvertedPrice: (invertedPrice: boolean) => void;
  showDetails?: boolean;
}) {
  const { safe } = useSafeAppsSDK();
  const router = useRouter();
  return (
    <TableCell
      className="cursor-default"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger>
          <DotsVerticalIcon className="size-4 hover:text-primary" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent>
            {showDetails && (
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() =>
                  router.push(`/${safe.chainId}/${safe.safeAddress}/${orderId}`)
                }
              >
                Check details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => {
                setInvertedPrice(!invertedPrice);
              }}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Invert price
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </TableCell>
  );
}
