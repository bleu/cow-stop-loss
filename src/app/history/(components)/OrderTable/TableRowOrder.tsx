import { useRouter } from "next/navigation";
import { useState } from "react";

import { Checkbox } from "#/components/Checkbox";
import Table from "#/components/Table";
import { TokenInfo } from "#/components/TokenInfo";
import { StopLossOrderType } from "#/contexts/ordersContext";
import { capitalize, formatDateToLocalDatetime } from "#/utils";

import { CancelOrdersDialog } from "../CancelOrdersDialog";


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
      <Table.BodyRow
       key={order?.id} 
       onClick={
        () => router.push(`/history/order/${order?.hash}`)
        }
      classNames="hover:cursor-pointer hover:bg-blue4 transition-colors duration-200 hover"
      >

        <Table.HeaderCell>
          <span className="sr-only"></span>
        </Table.HeaderCell>
        <Table.HeaderCell onClick={(e) => e.stopPropagation()} classNames="hover:cursor-default">
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
        </Table.HeaderCell>
        <Table.BodyCell>
          {formatDateToLocalDatetime(new Date(order?.blockTimestamp * 1000))}
        </Table.BodyCell>
        <Table.BodyCell>
          <TokenInfo
            id={order?.stopLossData?.tokenIn?.address}
            symbol={order?.stopLossData?.tokenIn?.symbol}
            chainId={order?.chainId}
          />
        </Table.BodyCell>
        <Table.BodyCell>
          <TokenInfo
            id={order?.stopLossData?.tokenOut?.address}
            symbol={order?.stopLossData?.tokenOut?.symbol}
            chainId={order?.chainId}
          />
        </Table.BodyCell>
        <Table.BodyCell>{capitalize(order?.status as string)}</Table.BodyCell>
        <Table.BodyCell>
          <CancelOrdersDialog
            tableRow
            ordersToCancel={[order.hash]}
            disabled={order?.status != "created" && order?.status != "posted"}
          />
        </Table.BodyCell>
      </Table.BodyRow>
    </>
  );
}
