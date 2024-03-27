import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { BaseTransaction } from "@safe-global/safe-apps-sdk";

import {
  AllTransactionArgs,
  TransactionFactory,
} from "#/lib/transactionFactory";

export function useRawTxData() {
  const { safe, sdk } = useSafeAppsSDK();

  const sendTransactions = async (argsArray: AllTransactionArgs[]) => {
    const txs = await Promise.all(
      argsArray.map((arg) => {
        return TransactionFactory.createRawTx(arg.type, arg);
      })
    );
    const txsToSend = txs.filter((tx) => tx !== null) as BaseTransaction[];
    return await sdk.txs.send({ txs: txsToSend });
  };

  return { safe, sendTransactions };
}
