import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";

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
    await sdk.txs.send({ txs });
  };

  return { safe, sendTransactions };
}
