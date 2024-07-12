"use client";

import {
  Button,
  Checkbox,
  formatNumber,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bleu/ui";
import { useState } from "react";

import { useOrder } from "#/contexts/ordersContext";
import { useTokens } from "#/contexts/tokensContext";
import { getOrderDescription } from "#/lib/orderDescription";
import { DraftOrder } from "#/lib/types";

import { ReviewOrdersDialog } from "./ReviewOrdersDialog";

export function DraftOrdersTab() {
  const { draftOrders, removeDraftOrders } = useOrder();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedOrders = draftOrders.filter((order) =>
    selectedIds.includes(order.id)
  );

  return (
    <>
      <ReviewOrdersDialog
        open={reviewDialogOpen}
        setOpen={setReviewDialogOpen}
        draftOrders={selectedOrders}
      />
      <div className="flex flex-col gap-2">
        <Table className="w-full rounded-lg">
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="rounded-tl-md">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Trigger price</TableHead>
              <TableHead>Limit price</TableHead>
              <TableHead className="rounded-tr-md">Current price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draftOrders.length ? (
              draftOrders.map((order) => {
                return (
                  <DraftOrderRow
                    order={order}
                    key={order.id}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedIds([...selectedIds, order.id]);
                        return;
                      }
                      setSelectedIds(
                        selectedIds.filter((id) => id !== order.id)
                      );
                    }}
                  />
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="py-4">
                    No draft orders. Create a new one to get started.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex justify-end gap-2">
          <Button
            variant="destructive"
            disabled={!selectedIds.length}
            onClick={() => {
              removeDraftOrders(selectedIds);
              setSelectedIds([]);
            }}
          >
            Delete
          </Button>
          <Button
            disabled={!selectedIds.length}
            onClick={() => {
              setReviewDialogOpen(true);
            }}
          >
            Review {selectedIds.length > 1 ? "orders" : "order"}
          </Button>
        </div>
      </div>
    </>
  );
}

export function DraftOrderRow({
  order,
  onSelect,
}: {
  order: DraftOrder;
  onSelect: (selected: boolean) => void;
}) {
  const orderDescription = getOrderDescription({
    tokenBuy: order.tokenBuy,
    tokenSell: order.tokenSell,
    amountSell: order.amountSell,
    isSellOrder: order.isSellOrder,
    amountBuy: order.amountBuy,
  });

  const priceUnity = `${order.tokenBuy.symbol}/${order.tokenSell.symbol}`;
  const { useTokenPairPrice } = useTokens();
  const { data: marketPrice } = useTokenPairPrice(
    order.tokenSell,
    order.tokenBuy
  );

  return (
    <TableRow className="text-xs">
      <TableCell>
        <Checkbox
          onCheckedChange={(checked) => {
            onSelect(checked as boolean);
          }}
        />
      </TableCell>
      <TableCell>{orderDescription}</TableCell>
      <TableCell>
        {formatNumber(order.strikePrice, 4)} {priceUnity}
      </TableCell>
      <TableCell>
        {formatNumber(order.limitPrice, 4)} {priceUnity}
      </TableCell>
      <TableCell>
        {marketPrice
          ? ` ${formatNumber(marketPrice, 4)} ${priceUnity}`
          : `Market price not found`}
      </TableCell>
    </TableRow>
  );
}
