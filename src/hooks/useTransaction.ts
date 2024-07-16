import { useMutation } from "@tanstack/react-query";

import {
  AllTransactionArgs,
  TransactionFactory,
} from "#/lib/transactionFactory";

import { useSafeApp } from "./useSafeApp";

export function useTransaction() {
  const { sdk } = useSafeApp();

  const sendTransactions = async (argsArray: AllTransactionArgs[]) => {
    const txs = await Promise.all(
      argsArray.map((arg) => TransactionFactory.createRawTx(arg.type, arg)),
    );
    const { safeTxHash } = await sdk.txs.send({ txs });
    return safeTxHash as `0x${string}`;
  };

  const { mutate: writeContract, isPending: isWriting } = useMutation({
    mutationFn: sendTransactions,
  });

  return { writeContract, isWriting };
}
