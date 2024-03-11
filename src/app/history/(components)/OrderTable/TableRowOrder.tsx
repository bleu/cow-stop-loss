import { TrashIcon } from "@radix-ui/react-icons";

import Table from "#/components/Table";
import { TokenInfo } from "#/components/TokenInfo";
import { StopLossOrderType } from "#/hooks/useOrders";
import { capitalize, formatDateToLocalDatetime } from "#/utils";

export function TableRowOrder({ order }: { order: StopLossOrderType }) {
  return (
    <>
      <Table.BodyRow key={order?.id}>
        <Table.HeaderCell>
          <span className="sr-only"></span>
        </Table.HeaderCell>
        <Table.BodyCell>
          {formatDateToLocalDatetime(new Date(order?.blockTimestamp * 1000))}
        </Table.BodyCell>
        <Table.BodyCell>
          <TokenInfo
            id={order?.stopLossParameters?.tokenIn?.address}
            symbol={order?.stopLossParameters?.tokenIn?.symbol}
            chainId={order?.chainId}
          />
        </Table.BodyCell>
        <Table.BodyCell>
          <TokenInfo
            id={order?.stopLossParameters?.tokenOut?.address}
            symbol={order?.stopLossParameters?.tokenOut?.symbol}
            chainId={order?.chainId}
          />
        </Table.BodyCell>
        <Table.BodyCell>{capitalize(order?.status)}</Table.BodyCell>
        <Table.BodyCell>
          <button type="button" className="flex items-center" disabled={true}>
            <TrashIcon className={"size-5 text-slate10"} />
          </button>
        </Table.BodyCell>
      </Table.BodyRow>
    </>
  );
}
