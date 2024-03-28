"use client";

import { epochToDate, formatDateTime,TableCell, TableRow } from "@bleu-fi/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Checkbox } from "#/components/Checkbox";
import { TokenInfo } from "#/components/TokenInfo";
import { StopLossOrderType } from "#/contexts/ordersContext";
import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

import { CancelOrdersDialog } from "../CancelOrdersDialog";
import { StatusBadge } from "../StatusBadge";


interface ITableRowOrder {
  order: StopLossOrderType;
  ordersToCancel: string[];
  setOrdersToCancel: (orders: string[]) => void;
}
  
export function TableRowOrder({
  order,
  ordersToCancel,
  setOrdersToCancel,
}: ITableRowOrder) {
  const router = useRouter()
  const [rowIsSelected, setRowIsSelected] = useState(false);

  return (
    <>
      <TableRow
       key={order?.id} 
       className="border-transparent hover:cursor-pointer hover:bg-background/10"
       onClick={
        () => router.push(`/history/order/${order?.hash}`)
        }
      >
        <TableCell>
          <span className="sr-only"></span>
        </TableCell>
        <TableCell 
          // Stop onClick from table row, which is redirecting to order details page
          onClick={(e) => e.stopPropagation()}
          className="cursor-default"
        >
          <Checkbox
            id="select-row"
            onChange={() => {
              setRowIsSelected(!rowIsSelected);
              const newOrdersToCancel = !rowIsSelected
                ? [...ordersToCancel, order.hash]
                : ordersToCancel.filter(
                    (orderHash) => orderHash !== order.hash,
                  );
              setOrdersToCancel(newOrdersToCancel);
            }}
            checked={rowIsSelected}
            aria-label="Select row"
          />
        </TableCell>
        <TableCell>
          {formatDateTime(epochToDate(Number(order?.blockTimestamp)))}
        </TableCell>
        <TableCell>
          {order?.stopLossData?.tokenIn ? (
            <TokenInfo
              token={order.stopLossData.tokenIn as IToken}
              chainId={order?.chainId as ChainId}
            />
          ) : (
            "Error loading token"
          )}
        </TableCell>
        <TableCell>
          {order?.stopLossData?.tokenOut ? (
            <TokenInfo
              token={order.stopLossData.tokenOut as IToken}
              chainId={order?.chainId as ChainId}
            />
          ) : (
            "Error loading token"
          )}
        </TableCell>
        <TableCell>
          <StatusBadge status={order?.status}/>
        </TableCell>
        <TableCell 
         // Stop onClick from table row, which is redirecting to order details page
          onClick={(e) => e.stopPropagation()}
          className="cursor-default"
        >
          <CancelOrdersDialog
            tableRow
            ordersToCancel={[order.hash]}
            disabled={order?.status != "created" && order?.status != "posted"}
          />
        </TableCell>
      </TableRow>
    </>
  );
}
