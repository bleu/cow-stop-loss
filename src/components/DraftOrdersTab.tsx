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

import { useDraftOrders } from "#/hooks/useDraftOrders";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { useUIStore } from "#/hooks/useUIState";
import { getOrderDescription } from "#/lib/orderDescription";
import { DraftOrder } from "#/lib/types";

import { RemoveDraftOrdersDialog } from "./RemoveDraftOrdersDialog";
import { ReviewOrdersDialog } from "./ReviewOrdersDialog";

export function DraftOrdersTab() {
  const draftOrders = useDraftOrders((state) => state.draftOrders);
  const setReviewDialogOpen = useUIStore((state) => state.setReviewDialogOpen);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedOrders = draftOrders.filter((order) =>
    selectedIds.includes(order.id),
  );

  return (
    <>
      <ReviewOrdersDialog draftOrders={selectedOrders} />
      <div className="flex flex-col gap-2">
        <Table className="w-full rounded-lg">
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="rounded-tl-md">
                <Checkbox
                  checked={
                    selectedIds.length === draftOrders.length &&
                    !!draftOrders.length
                  }
                  disabled={!draftOrders.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(draftOrders.map((order) => order.id));
                      return;
                    }
                    setSelectedIds([]);
                  }}
                />
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
                    checked={selectedIds.includes(order.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedIds([...selectedIds, order.id]);
                        return;
                      }
                      setSelectedIds(
                        selectedIds.filter((id) => id !== order.id),
                      );
                    }}
                  />
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="py-4">
                    No draft orders. Create one to get started.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex justify-end gap-2">
          <RemoveDraftOrdersDialog
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />
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
  checked,
}: {
  order: DraftOrder;
  checked: boolean;
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

  const { data: marketPrice } = useTokenPairPrice(
    order.tokenSell,
    order.tokenBuy,
  );

  return (
    <TableRow className="text-xs">
      <TableCell>
        <Checkbox
          checked={checked}
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
