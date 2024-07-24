import { TransactionStatus } from "@safe-global/safe-gateway-typescript-sdk";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ChainId, publicClientsFromIds } from "#/lib/publicClients";
import {
  AllTransactionArgs,
  TransactionFactory,
} from "#/lib/transactionFactory";

import { useOrderList } from "./useOrderList";
import { usePonderState } from "./usePonderState";
import { useQueuedTxs } from "./useQueuedOrders";
import { useSafeApp } from "./useSafeApp";

interface TxManagerState {
  safeTxHashs: `0x${string}`[];
  pendingTxsBlockNumber: number[];
}

interface TxManagerActions {
  setSafeTxHashs: (safeTxHashs: `0x${string}`[]) => void;
  setPendingTxsBlockNumber: (pendingTxsBlockNumber: number[]) => void;
}

const useTxManagerStore = create<TxManagerState & TxManagerActions>()(
  persist(
    (set) => ({
      safeTxHashs: [],
      pendingTxsBlockNumber: [],
      creatingOrders: [],
      deletingOrdersId: [],
      setSafeTxHashs: (safeTxHashs) => set({ safeTxHashs }),
      setPendingTxsBlockNumber: (pendingTxsBlockNumber) =>
        set({ pendingTxsBlockNumber }),
    }),
    {
      name: "tx-manager-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useTxManager() {
  const { sdk, chainId } = useSafeApp();
  const [
    safeTxHashs,
    pendingTxsBlockNumber,
    setSafeTxHashs,
    setPendingTxsBlockNumber,
  ] = useTxManagerStore((state) => [
    state.safeTxHashs,
    state.pendingTxsBlockNumber,
    state.setSafeTxHashs,
    state.setPendingTxsBlockNumber,
  ]);

  const { mutate: mutateOrdersQueue } = useQueuedTxs();
  const { mutate: mutateOrdersList } = useOrderList();
  const { mutate: mutatePonder } = usePonderState();

  const publicClient = publicClientsFromIds[chainId as ChainId];

  const sendTransactions = async (argsArray: AllTransactionArgs[]) => {
    const txs = await Promise.all(
      argsArray.map((arg) => {
        return TransactionFactory.createRawTx(arg.type, arg);
      }),
    );
    const { safeTxHash } = await sdk.txs.send({ txs });
    mutateOrdersQueue();
    mutateOrdersList();
    return safeTxHash as `0x${string}`;
  };

  const updateTxStates = () => {
    safeTxHashs.forEach(async (safeTxHash) => {
      try {
        const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash);
        if (
          [
            TransactionStatus.AWAITING_CONFIRMATIONS,
            TransactionStatus.AWAITING_EXECUTION,
          ].includes(safeTx?.txStatus)
        )
          return;

        setSafeTxHashs(safeTxHashs.filter((txHash) => txHash !== safeTxHash));
        if (
          !safeTx.txHash ||
          [TransactionStatus.CANCELLED, TransactionStatus.FAILED].includes(
            safeTx?.txStatus,
          )
        )
          return;
        const transaction = await publicClient.getTransaction({
          hash: safeTx.txHash as `0x${string}`,
        });
        setPendingTxsBlockNumber([
          ...pendingTxsBlockNumber,
          Number(transaction.blockNumber),
        ]);
      } catch {
        setSafeTxHashs(safeTxHashs.filter((txHash) => txHash !== safeTxHash));
      }
    });
  };

  const updateTxBlockNumbers = async () => {
    if (pendingTxsBlockNumber.length === 0) return;
    const ponderNewBlockNumber = await mutatePonder();
    const toBeCatchBlockNumbers = pendingTxsBlockNumber.filter(
      (blockNumber) => blockNumber > (ponderNewBlockNumber || 0),
    );
    if (toBeCatchBlockNumbers.length != pendingTxsBlockNumber.length) {
      setPendingTxsBlockNumber(toBeCatchBlockNumbers);
      mutateOrdersQueue();
      mutateOrdersList();
    }
  };

  const writeContract = async (txs: AllTransactionArgs[]) => {
    const safeTxHash = await sendTransactions(txs);
    setSafeTxHashs([...safeTxHashs, safeTxHash]);
    return safeTxHash;
  };

  useEffect(() => {
    if (safeTxHashs.length === 0) return;
    const interval = setInterval(updateTxStates, 5_000);
    return () => clearInterval(interval);
  }, [safeTxHashs]);

  useEffect(() => {
    if (pendingTxsBlockNumber.length === 0) return;
    const interval = setInterval(updateTxBlockNumbers, 5_000);
    return () => clearInterval(interval);
  }, [pendingTxsBlockNumber]);

  return {
    writeContract,
  };
}
