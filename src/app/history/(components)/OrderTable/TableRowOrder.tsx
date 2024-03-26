import { TableCell, TableRow } from "@bleu-fi/ui";
import { TrashIcon } from "@radix-ui/react-icons";

import { TokenInfo } from "#/components/TokenInfo";
import { StopLossOrderType } from "#/hooks/useOrders";
import { useRawTxData } from "#/hooks/useRawTxData";
import { ChainId } from "#/lib/publicClients";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";
import { IToken } from "#/lib/types";
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
                disabled
                  ? "text-foreground-primary/50"
                  : "text-destructive hover:destructive/80"
              )}
            />
          </button>
        </TableCell>
      </TableRow>
    </>
  );
}
