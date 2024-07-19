import { Button, Checkbox, formatNumber } from "@bleu/ui";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight } from "lucide-react";
import React, { useState } from "react";
import { formatUnits } from "viem";

import { DataTableColumnHeader } from "#/components/data-table/data-table-column-header";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { DraftOrder, IToken, StopLossOrderType } from "#/lib/types";

import { StatusBadge } from "../StatusBadge";
import { ConsolidatedOrderType } from ".";

type PriceKey = "strikePrice" | "limitPrice" | "currentPrice";

interface TokenPair {
  tokenA: Omit<IToken, "__typename">;
  tokenB: Omit<IToken, "__typename">;
}

const isStopLossOrder = (
  order: ConsolidatedOrderType,
): order is StopLossOrderType => {
  return "stopLossData" in order && order.stopLossData !== null;
};

const isDraftOrder = (order: ConsolidatedOrderType): order is DraftOrder => {
  return "tokenBuy" in order && "tokenSell" in order;
};

export function getOrderDescription(order: ConsolidatedOrderType): string {
  if (isStopLossOrder(order) && order.stopLossData) {
    const { isSellOrder, tokenAmountIn, tokenIn, tokenAmountOut, tokenOut } =
      order.stopLossData;
    return `${isSellOrder ? "Sell" : "Buy"} ${formatUnits(tokenAmountIn, tokenIn.decimals)} ${tokenIn.symbol} for ${formatUnits(tokenAmountOut, tokenOut.decimals)} ${tokenOut.symbol}`;
  } else if (isDraftOrder(order)) {
    return `${order.isSellOrder ? "Sell" : "Buy"} ${order.amountSell} ${order.tokenSell.symbol} for ${order.amountBuy} ${order.tokenBuy.symbol}`;
  }
  return "Invalid order";
}

const getTokenPair = (order: ConsolidatedOrderType): TokenPair | null => {
  if (isStopLossOrder(order) && order.stopLossData) {
    return {
      tokenA: order.stopLossData.tokenOut,
      tokenB: order.stopLossData.tokenIn,
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

  if (
    isStopLossOrder(order) &&
    order.stopLossData &&
    priceKey === "strikePrice"
  ) {
    return Number(formatUnits(order.stopLossData.strike, 18));
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
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => getOrderDescription(row.original),
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
      accessorKey: "filledPct",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Filled" />
      ),
      cell: ({ row }) => {
        if ("filledPct" in row.original) {
          return `${((row.original.filledPct || 0) * 100).toFixed()}%`;
        }
        return "-";
      },
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
        if ("status" in row.original) {
          return <StatusBadge status={row.original.status} />;
        }
        return "Draft";
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
  ];
}
