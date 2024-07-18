import {
  AllTransactionArgs,
  TransactionFactory,
} from "#/lib/transactionFactory";

import { useSafeApp } from "./useSafeApp";

export function useTxManager() {
  const { sdk } = useSafeApp();

  const writeContract = async (argsArray: AllTransactionArgs[]) => {
    const txs = await Promise.all(
      argsArray.map((arg) => {
        return TransactionFactory.createRawTx(arg.type, arg);
      })
    );
    const { safeTxHash } = await sdk.txs.send({ txs });
    const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash);
    return {
      safeTxHash: safeTxHash as `0x${string}`,
      safeTx,
    };
  };

  return {
    writeContract,
  };
}
