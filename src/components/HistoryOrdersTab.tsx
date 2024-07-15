"use client";

import {
  epochToDate,
  formatNumber,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@bleu/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";

import { useOrderList } from "#/hooks/useOrderList";
import { StopLossOrderType } from "#/lib/types";

import { StatusBadge } from "./StatusBadge";
import { useState } from "react";
import { OrderDropdownMenuCell } from "./OrderDropdownMenuCell";

export function HistoryOrdersTab() {
  const { historyOrders, isLoading } = useOrderList();

  return (
    <Table className="w-full rounded-lg">
      <TableHeader className="bg-background">
        <TableCell className="rounded-tl-md">Created</TableCell>
        <TableCell>Order</TableCell>
        <TableCell>Trigger price</TableCell>
        <TableCell>Filled</TableCell>
        <TableCell>Status</TableCell>
        <TableCell className="rounded-tr-md">
          <span className="sr-only">Actions</span>
        </TableCell>{" "}
      </TableHeader>
      <TableBody>
        {historyOrders.length ? (
          historyOrders.map((order) => {
            return <HistoryOrderRow order={order} key={order.id} />;
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              {isLoading ? (
                <Spinner />
              ) : (
                <div className="py-4">
                  No open orders. Create a new one to get started.
                </div>
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function HistoryOrderRow({ order }: { order: StopLossOrderType }) {
  const { safe } = useSafeAppsSDK();
  const router = useRouter();
  const [invertedPrice, setInvertedPrice] = useState(false);

  if (!order.stopLossData) {
    return null;
  }

  const priceUnity = invertedPrice
    ? `${order.stopLossData.tokenIn.symbol}/${order.stopLossData.tokenOut.symbol}`
    : order.stopLossData.tokenOut.symbol +
      "/" +
      order.stopLossData.tokenIn.symbol;

  const triggerPrice = Number(formatUnits(order.stopLossData?.strike, 18));

  const amountSell = Number(
    formatUnits(
      order.stopLossData?.tokenAmountIn,
      order.stopLossData.tokenIn.decimals
    )
  );
  const amountBuy = Number(
    formatUnits(
      order.stopLossData?.tokenAmountOut,
      order.stopLossData.tokenOut.decimals
    )
  );

  const orderDateTime = epochToDate(
    Number(order.blockTimestamp)
  ).toLocaleString();

  return (
    <TableRow
      className="hover:bg-background text-xs cursor-pointer"
      onClick={() =>
        router.push(`/${safe.chainId}/${safe.safeAddress}/${order?.id}`)
      }
    >
      <TableCell>{orderDateTime}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{order.stopLossData.isSellOrder ? "Sell" : "Buy"} Order</span>
          <span>
            {formatNumber(amountSell, 4)} {order.stopLossData.tokenIn.symbol} to{" "}
            {formatNumber(amountBuy, 4)} {order.stopLossData.tokenOut.symbol}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {formatNumber(invertedPrice ? 1 / triggerPrice : triggerPrice, 4)}{" "}
        {priceUnity}
      </TableCell>
      <TableCell>{((order.filledPct || 0) * 100).toFixed()}%</TableCell>
      <TableCell>
        <StatusBadge status={order.status} />
      </TableCell>
      <OrderDropdownMenuCell
        orderId={order.id}
        invertedPrice={invertedPrice}
        setInvertedPrice={setInvertedPrice}
      />
    </TableRow>
  );
}
