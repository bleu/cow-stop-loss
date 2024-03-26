import { TableCell, TableRow } from "@bleu-fi/ui";
import { TrashIcon } from "@radix-ui/react-icons";

import { TokenInfo } from "#/components/TokenInfo";
import { StopLossOrderType } from "#/hooks/useOrders";
import { useRawTxData } from "#/hooks/useRawTxData";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";
import { capitalize, cn, formatDateToLocalDatetime } from "#/utils";

export function TableRowOrder({ order }: { order: StopLossOrderType }) {
  const { sendTransactions } = useRawTxData();

  async function CancelOrder() {
    const cancelTransactionsData = [
      {
        type: TRANSACTION_TYPES.ORDER_CANCEL,
        hash: order?.hash,
      } as OrderCancelArgs,
    ];

    await sendTransactions(cancelTransactionsData);
  }
  const disabled = order?.status != "created" && order?.status != "posted";

  return (
    <>
      <TableRow key={order?.id}>
        <TableCell>
          <span className="sr-only"></span>
        </TableCell>
        <TableCell>
          {formatDateToLocalDatetime(new Date(order?.blockTimestamp * 1000))}
        </TableCell>
        <TableCell>
          <TokenInfo
            id={order?.stopLossData?.tokenIn?.address}
            symbol={order?.stopLossData?.tokenIn?.symbol}
            chainId={order?.chainId}
          />
        </TableCell>
        <TableCell>
          <TokenInfo
            id={order?.stopLossData?.tokenOut?.address}
            symbol={order?.stopLossData?.tokenOut?.symbol}
            chainId={order?.chainId}
          />
        </TableCell>
        <TableCell>{capitalize(order?.status as string)}</TableCell>
        <TableCell>
          <button
            type="button"
            className="flex items-center"
            onClick={CancelOrder}
            disabled={disabled}
          >
            <TrashIcon
              className={cn(
                "size-5",
                disabled ? "text-slate10" : "text-tomato9 hover:text-tomato10"
              )}
            />
          </button>
        </TableCell>
      </TableRow>
    </>
  );
}
