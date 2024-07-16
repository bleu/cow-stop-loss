"use client";

import {
  Button,
  Checkbox,
  epochToDate,
  formatNumber,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@bleu/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUnits } from "viem";

import { useOrder } from "#/contexts/ordersContext";
import { useOrderList } from "#/hooks/useOrderList";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";
import { IToken, StopLossOrderType } from "#/lib/types";

import { OrderDropdownMenuCell } from "./OrderDropdownMenuCell";
import { StatusBadge } from "./StatusBadge";
import { Spinner } from "./ui/spinner";

export function OpenOrdersTab() {
  const {
    txManager: { writeContract, isWriting },
    setTxPendingDialog,
    isLoading,
  } = useOrder();
  const { openOrders } = useOrderList();
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
      <Table className="w-full rounded-lg">
        <TableHeader className="bg-background">
          <TableCell className="rounded-tl-md">
            <Checkbox
              checked={selectedIds.length === openOrders.length}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedIds(openOrders.map((order) => order.id));
                  return;
                }
                setSelectedIds([]);
              }}
            />
          </TableCell>
          <TableCell>Created</TableCell>
          <TableCell>Order</TableCell>
          <TableCell>Trigger price</TableCell>
          <TableCell>Current price</TableCell>
          <TableCell>Filled</TableCell>
          <TableCell>Status</TableCell>
          <TableCell className="rounded-tr-md">
            <span className="sr-only">Actions</span>
          </TableCell>
        </TableHeader>
        <TableBody>
          {openOrders.length ? (
            openOrders.map((order) => {
              return (
                <OpenOrderRow
                  checked={selectedIds.includes(order.id)}
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
              <TableCell colSpan={100} className="text-center">
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
  checked,
}: {
  checked: boolean;
  order: StopLossOrderType;
  onSelect: (selected: boolean) => void;
}) {
  const { safe } = useSafeAppsSDK();
  const router = useRouter();

  const { data: marketPrice } = useTokenPairPrice(
    order.stopLossData?.tokenIn as IToken,
    order.stopLossData?.tokenOut as IToken,
  );

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
      order.stopLossData.tokenIn.decimals,
    ),
  );
  const amountBuy = Number(
    formatUnits(
      order.stopLossData?.tokenAmountOut,
      order.stopLossData.tokenOut.decimals,
    ),
  );

  const orderDateTime = epochToDate(
    Number(order.blockTimestamp),
  ).toLocaleString();

  return (
    <TableRow
      className="hover:bg-background text-xs cursor-pointer"
      onClick={() =>
        router.push(`/${safe.chainId}/${safe.safeAddress}/${order?.id}`)
      }
    >
      <TableCell
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="cursor-default"
      >
        <Checkbox
          checked={checked}
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
        {formatNumber(invertedPrice ? 1 / triggerPrice : triggerPrice, 4)}{" "}
        {priceUnity}
      </TableCell>
      <TableCell>
        {marketPrice
          ? ` ${formatNumber(invertedPrice ? 1 / marketPrice : triggerPrice, 4)} ${priceUnity}`
          : `Loading...`}
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
