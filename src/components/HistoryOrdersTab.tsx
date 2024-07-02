"use client";

import {
  epochToDate,
  formatDateTime,
  formatNumber,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@bleu/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";

import { useOrder } from "#/contexts/ordersContext";
import { StopLossOrderType } from "#/lib/types";

import { StatusBadge } from "./StatusBadge";

export function HistoryOrdersTab() {
  const { historyOrders } = useOrder();

  return (
    <Table className="w-full rounded-md border-separate border">
      <TableHeader className="bg-background/70 text-foreground border-b overflow-scroll">
        <TableCell>Created</TableCell>
        <TableCell>Order</TableCell>
        <TableCell>Trigger price</TableCell>
        <TableCell>Filled</TableCell>
        <TableCell className="rounded-tr-md">Status</TableCell>
      </TableHeader>
      <TableBody>
        {historyOrders.length ? (
          historyOrders.map((order) => {
            return <HistoryOrderRow order={order} key={order.id} />;
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No history orders. Create a new one to get started.
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
  if (!order.stopLossData) {
    return null;
  }

  const priceUnity =
    order.stopLossData.tokenOut.symbol +
    "/" +
    order.stopLossData.tokenIn.symbol;

  const triggerPrice = formatUnits(order.stopLossData?.strike, 18);

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

  const orderDateTime = formatDateTime(
    epochToDate(Number(order.blockTimestamp))
  );

  return (
    <TableRow
      onClick={() =>
        router.push(`/${safe.chainId}/${safe.safeAddress}/${order?.id}`)
      }
      className="cursor-pointer hover:bg-background/10 text-xs"
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
        {formatNumber(triggerPrice, 4)} {priceUnity}
      </TableCell>
      <TableCell>{((order.filledPct || 0) * 100).toFixed()}%</TableCell>
      <TableCell>
        <StatusBadge status={order.status} />
      </TableCell>
    </TableRow>
  );
}
