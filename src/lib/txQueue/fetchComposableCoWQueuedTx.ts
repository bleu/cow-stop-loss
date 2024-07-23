import {
  getTransactionDetails,
  getTransactionQueue,
  Transaction,
  TransactionDetails,
} from "@safe-global/safe-gateway-typescript-sdk";
import { COMPOSABLE_COW_ADDRESS } from "../contracts";
import { ChainId } from "../publicClients";
import { Address } from "viem";

export async function fetchComposableCoWQueuedTxs({
  chainId,
  address,
}: {
  chainId: ChainId;
  address: Address;
}): Promise<TransactionDetails[]> {
  const allQueuedTransactions = await getTransactionQueue(
    String(chainId),
    address
  );

  const queuedTransaction = allQueuedTransactions.results.filter((result) => {
    if (result.type != "TRANSACTION") return false;
    if (!(`methodName` in result.transaction.txInfo)) return false;
    return (
      // order creation
      result.transaction.txInfo.methodName === "multiSend" ||
      // order cancellation
      result.transaction.txInfo.to.value.toLowerCase() ===
        COMPOSABLE_COW_ADDRESS.toLowerCase()
    );
  }) as Transaction[];

  const queuedTransactionQueueDetails = await Promise.all(
    queuedTransaction.map((transaction) =>
      getTransactionDetails(String(chainId), transaction.transaction.id)
    )
  );
  return queuedTransactionQueueDetails.filter(
    (transactionDetails) =>
      transactionDetails.txData?.dataDecoded?.parameters?.[0].valueDecoded?.some(
        (value) =>
          value.to?.toLowerCase() == COMPOSABLE_COW_ADDRESS.toLowerCase()
      ) ||
      transactionDetails.txData?.to?.value.toLowerCase() ==
        COMPOSABLE_COW_ADDRESS.toLowerCase()
  );
}
