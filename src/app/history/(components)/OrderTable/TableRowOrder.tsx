import { TrashIcon } from "@radix-ui/react-icons";

import Table from "#/components/Table";
import { TokenInfo } from "#/components/TokenInfo";
import { StopLossOrderType } from "#/hooks/useOrders";
import { useRawTxData } from "#/hooks/useRawTxData";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";
import { capitalize, cn, formatDateToLocalDatetime } from "#/utils";

export function TableRowOrder({ order }: { order: StopLossOrderType }) {
  const { sendTransactions } = useRawTxData();

  async function CancelOrder() {
    const cancelTransactionsData = [{
      type: TRANSACTION_TYPES.ORDER_CANCEL,
      hash: order?.hash,
    } as OrderCancelArgs]

    await sendTransactions(cancelTransactionsData);
  }
  //change status name on COW-127 to open be posted
  const disabled = order?.status != "created" && order?.status != "open";

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
          <button type="button" className="flex items-center" onClick={CancelOrder} disabled={disabled}>
            <TrashIcon className={cn("size-5", disabled ? "text-slate10" : "text-tomato9 hover:text-tomato10")} />
          </button>
        </Table.BodyCell>
      </Table.BodyRow>
    </>
  );
}
