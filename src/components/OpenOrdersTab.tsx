"use client";

import {
  Button,
  Checkbox,
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
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import { useOrder } from "#/contexts/ordersContext";
import { useTokens } from "#/contexts/tokensContext";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";
import { IToken, StopLossOrderType } from "#/lib/types";

export function OpenOrdersTab() {
  const {
    openOrders,
    txManager: { writeContract, isWriting },
    setTxPendingDialog,
  } = useOrder();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const onCancelOrders = () => {
    const orders = openOrders.filter((order) => selectedIds.includes(order.id));
    const deleteTxArgs = orders.map((order) => ({
      type: TRANSACTION_TYPES.ORDER_CANCEL,
      hash: order.hash,
    })) as OrderCancelArgs[];
    writeContract(deleteTxArgs, {
      onSuccess: () => {
        setSelectedIds([]);
        setTxPendingDialog(true);
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Table className="w-full rounded-md border-separate border">
        <TableHeader className="bg-background/70 text-foreground border-b">
          <TableCell className="rounded-tl-md">
            <span className="sr-only">Select</span>
          </TableCell>
          <TableCell>Created</TableCell>
          <TableCell>Order</TableCell>
          <TableCell>Trigger price</TableCell>
          <TableCell>Current price</TableCell>
          <TableCell className="rounded-tr-md">Filled</TableCell>
        </TableHeader>
        <TableBody>
          {openOrders.length ? (
            openOrders.map((order) => {
              return (
                <OpenOrderRow
                  order={order}
                  key={order.id}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedIds([...selectedIds, order.id]);
                      return;
                    }
                    setSelectedIds(selectedIds.filter((id) => id !== order.id));
                  }}
                />
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No open orders. Create a new one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end gap-2">
        <Button
          variant="destructive"
          disabled={!selectedIds.length}
          onClick={onCancelOrders}
          loading={isWriting}
          loadingText={"Cancelling..."}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function OpenOrderRow({
  order,
  onSelect,
}: {
  order: StopLossOrderType;
  onSelect: (selected: boolean) => void;
}) {
  const router = useRouter();
  const { safe } = useSafeAppsSDK();

  const [marketPrice, setMarketPrice] = useState<number>();
  const { getTokenPairPrice } = useTokens();

  async function fetchMarketPrice() {
    if (!order.stopLossData) {
      return;
    }
    const price = await getTokenPairPrice(
      order.stopLossData.tokenIn as IToken,
      order.stopLossData.tokenOut as IToken
    );
    setMarketPrice(price);
  }

  useEffect(() => {
    fetchMarketPrice();
  }, [order]);

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
      <TableCell
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="cursor-default"
      >
        <Checkbox
          onCheckedChange={(checked) => {
            onSelect(checked as boolean);
          }}
        />
      </TableCell>
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
      <TableCell>
        {marketPrice
          ? ` ${formatNumber(marketPrice, 4)} ${priceUnity}`
          : `Loading...`}
      </TableCell>
      <TableCell>{((order.filledPct || 0) * 100).toFixed()}%</TableCell>
    </TableRow>
  );
}
