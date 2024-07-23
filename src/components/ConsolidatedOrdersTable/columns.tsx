import { Button, Checkbox, formatNumber } from "@bleu/ui";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight } from "lucide-react";
import React, { useState } from "react";
import { formatUnits } from "viem";

import { DataTableColumnHeader } from "#/components/data-table/data-table-column-header";
import { useSafeApp } from "#/hooks/useSafeApp";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { DraftOrder, IToken, StopLossOrderType } from "#/lib/types";

import { StatusBadge } from "../StatusBadge";
import { LinkComponent } from "../ui/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip-primitive";
import { ConsolidatedOrderType } from ".";

type PriceKey = "strikePrice" | "limitPrice" | "currentPrice";

interface TokenPair {
  tokenA: Omit<IToken, "__typename">;
  tokenB: Omit<IToken, "__typename">;
}

const isPostedOrder = (
  order: ConsolidatedOrderType,
): order is StopLossOrderType => {
  return "stopLossData" in order && order.stopLossData !== null;
};

const isDraftOrder = (order: ConsolidatedOrderType): order is DraftOrder => {
  return "tokenBuy" in order && "tokenSell" in order;
};

export function getOrderDescription(order: ConsolidatedOrderType): string {
  if (isPostedOrder(order) && order.stopLossData) {
    const {
      isSellOrder,
      tokenSellAmount,
      tokenSell,
      tokenBuyAmount,
      tokenBuy,
    } = order.stopLossData;
    return `${isSellOrder ? "Sell" : "Buy"} ${formatUnits(tokenSellAmount as bigint, tokenSell.decimals)} ${tokenSell.symbol} for ${formatUnits(tokenBuyAmount as bigint, tokenBuy.decimals)} ${tokenBuy.symbol}`;
  } else if (isDraftOrder(order)) {
    return `${order.isSellOrder ? "Sell" : "Buy"} ${order.amountSell} ${order.tokenSell.symbol} for ${order.amountBuy} ${order.tokenBuy.symbol}`;
  }
  return "Invalid order";
}

const getTokenPair = (order: ConsolidatedOrderType): TokenPair | null => {
  if (isPostedOrder(order) && order.stopLossData) {
    return {
      tokenA: order.stopLossData.tokenBuy,
      tokenB: order.stopLossData.tokenSell,
    } as TokenPair;
  }
  if (isDraftOrder(order)) {
    return {
      tokenA: order.tokenBuy,
      tokenB: order.tokenSell,
    };
  }
  return null;
};

const usePrice = (
  order: ConsolidatedOrderType,
  priceKey: PriceKey,
): number | null => {
  const tokenPair = getTokenPair(order);
  const { data: marketPrice } = useTokenPairPrice(
    tokenPair?.tokenB,
    tokenPair?.tokenA,
  );

  if (priceKey === "currentPrice") {
    return marketPrice ?? null;
  }

  if (priceKey === "limitPrice" && isPostedOrder(order) && order.stopLossData) {
    const amountSell = formatUnits(
      order.stopLossData.tokenSellAmount as bigint,
      order.stopLossData.tokenSell.decimals,
    );
    const amountBuy = formatUnits(
      order.stopLossData.tokenBuyAmount as bigint,
      order.stopLossData.tokenBuy.decimals,
    );
    return Number(amountBuy) / Number(amountSell);
  }

  if (
    isPostedOrder(order) &&
    order.stopLossData &&
    priceKey === "strikePrice"
  ) {
    return Number(formatUnits(order.stopLossData.strike as bigint, 18));
  }

  if (isDraftOrder(order) && priceKey in order) {
    return order[priceKey] as number;
  }

  return null;
};

const PriceDisplay: React.FC<{
  tokenPair: TokenPair;
  price: number | null;
}> = ({ tokenPair, price }) => {
  const [isInverted, setIsInverted] = useState(false);
  const { tokenA, tokenB } = tokenPair;
  const displayPrice = price !== null ? (isInverted ? 1 / price : price) : null;
  const symbols = isInverted
    ? `${tokenB.symbol}/ ${tokenA.symbol}`
    : `${tokenA.symbol}/ ${tokenB.symbol}`;

  if (displayPrice === null) return "-";
  if (displayPrice === 0) return null;
  return (
    <div className="flex flex-row gap-1">
      <div className="my-auto flex-1">{formatNumber(displayPrice, 4)}</div>
      {displayPrice && (
        <Button
          type="button"
          variant="ghost"
          className="py-0 px-1 text-accent text-xs whitespace-break-spaces flex-1"
          onClick={() => setIsInverted(!isInverted)}
        >
          {symbols}

          <ArrowLeftRight className="size-4" />
        </Button>
      )}
    </div>
  );
};

export const InvertiblePrice: React.FC<{
  order: ConsolidatedOrderType;
  priceKey: PriceKey;
}> = ({ order, priceKey }) => {
  const tokenPair = getTokenPair(order);
  const price = usePrice(order, priceKey);

  if (!tokenPair) return <span>Invalid order type</span>;

  return <PriceDisplay tokenPair={tokenPair} price={price} />;
};

export function getColumns(): ColumnDef<ConsolidatedOrderType>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          className="mr-1"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const isSelectable = row.getCanSelect();
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Checkbox
                  className="mr-1"
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Select row"
                  disabled={!isSelectable}
                />
              </TooltipTrigger>
              {!isSelectable && (
                <TooltipContent className="bg-primary text-primary-foreground text-xs">
                  You can only manage Draft, Open, or Partially Filled orders
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "order",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => (
        <div className="min-w-32">{getOrderDescription(row.original)}</div>
      ),
    },
    {
      accessorKey: "strikePrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trigger price" />
      ),
      cell: ({ row }) => (
        <InvertiblePrice order={row.original} priceKey="strikePrice" />
      ),
    },
    {
      accessorKey: "limitPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Limit price" />
      ),
      cell: ({ row }) => (
        <InvertiblePrice order={row.original} priceKey="limitPrice" />
      ),
    },
    {
      accessorKey: "currentPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Current price" />
      ),
      cell: ({ row }) => (
        <InvertiblePrice order={row.original} priceKey="currentPrice" />
      ),
    },
    {
      accessorKey: "blockTimestamp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        if (!row.original.blockTimestamp) {
          return "-";
        }
        const timestamp = Number(row.original.blockTimestamp);
        return new Date(timestamp * 1000)
          .toLocaleTimeString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(",", "");
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return <StatusBadge status={row.original.status} />;
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
    {
      id: "details",
      cell: ({ row }) => {
        if (isPostedOrder(row.original) && "id" in row.original) {
          const { safeAddress, chainId } = useSafeApp();
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <LinkComponent
                    href={`/${chainId}/${safeAddress}/${row.original.id}`}
                  >
                    <ArrowTopRightIcon className="size-4 hover:text-primary" />
                  </LinkComponent>
                </TooltipTrigger>
                <TooltipContent className="bg-primary text-primary-foreground text-xs">
                  View details
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return <span className="text-center">-</span>;
      },
    },
  ];
}
