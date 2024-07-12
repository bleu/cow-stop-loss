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
import { formatUnits } from "viem";

import { useOrder } from "#/contexts/ordersContext";
import { StopLossOrderType } from "#/lib/types";

import { StatusBadge } from "./StatusBadge";
import { useRouter } from "next/navigation";

export function HistoryOrdersTab() {
  const { historyOrders, isLoading } = useOrder();

  return (
    <Table className="w-full rounded-lg">
      <TableHeader className="bg-background">
        <TableCell className="rounded-tl-md">Created</TableCell>
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
        {formatNumber(triggerPrice, 4)} {priceUnity}
      </TableCell>
      <TableCell>{((order.filledPct || 0) * 100).toFixed()}%</TableCell>
      <TableCell>
        <StatusBadge status={order.status} />
      </TableCell>
    </TableRow>
  );
}
