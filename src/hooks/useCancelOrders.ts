import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";

import { useRawTxData } from "./useRawTxData";

export function useCancelOrders() {
  const { sendTransactions } = useRawTxData();

  async function cancelOrders(ordersHash: string[]) {
    const ordersHashArray = Array.isArray(ordersHash)
      ? ordersHash
      : [ordersHash];

    const cancelTransactionsData = ordersHashArray.map(
      (orderHash) =>
        ({
          type: TRANSACTION_TYPES.ORDER_CANCEL,
          hash: orderHash,
        }) as OrderCancelArgs,
    );

    await sendTransactions(cancelTransactionsData);
  }

  return { cancelOrders };
}
