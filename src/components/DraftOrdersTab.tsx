"use client";

import {
  Button,
  Checkbox,
  formatNumber,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@bleu/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";

import { useSwapContext } from "#/contexts/swapContext";
import { ChainId } from "#/lib/publicClients";
import { fetchPairUsdPrice } from "#/lib/tokenUtils";
import { DraftOrder, IToken } from "#/lib/types";

import { ReviewOrdersDialog } from "./ReviewOrdersDialog";

export function DraftOrdersTab() {
  const { draftOrders, removeDraftOrders } = useSwapContext();
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
        <Table className="w-full rounded-md border-separate border">
          <TableHeader className="bg-background/70 text-foreground border-b">
            <TableCell className="rounded-tl-md">
              <span className="sr-only">Select</span>
            </TableCell>
            <TableCell>Order</TableCell>
            <TableCell>Trigger price</TableCell>
            <TableCell>Limit price</TableCell>
            <TableCell className="rounded-tr-md">Current price</TableCell>
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
                  No draft orders. Create a new one to get started.
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
          <Button disabled={!selectedIds.length}>Review orders</Button>
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
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const [marketPrice, setMarketPrice] = useState<number>();

  const orderDescription = `Swap ${formatNumber(order.amountSell, 2)} ${order.tokenSell.symbol} ${order.isSellOrder ? `` : `at most`} for ${order.isSellOrder ? `at least` : ``} ${formatNumber(order.amountBuy, 2)} ${order.tokenBuy.symbol}`;

  const priceUnity = `${order.tokenBuy.symbol}/${order.tokenSell.symbol}`;

  async function updateMarketPrice() {
    const marketPrice = await fetchPairUsdPrice({
      baseToken: order.tokenSell as IToken,
      quoteToken: order.tokenBuy as IToken,
      chainId: chainId as ChainId,
    });
    setMarketPrice(marketPrice);
  }

  useEffect(() => {
    updateMarketPrice();
  }, []);

  return (
    <TableRow className="h-7">
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
        {marketPrice && formatNumber(marketPrice, 4)} {priceUnity}
      </TableCell>
    </TableRow>
  );
}
