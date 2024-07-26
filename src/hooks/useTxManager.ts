import { GatewayTransactionDetails } from "@safe-global/safe-apps-sdk";
import { TransactionStatus } from "@safe-global/safe-gateway-typescript-sdk";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ChainId, publicClientsFromIds } from "#/lib/publicClients";
import {
  AllTransactionArgs,
  TransactionFactory,
} from "#/lib/transactionFactory";

import { useCreatingOrders } from "./useCreatingOrders";
import { useOrderList } from "./useOrderList";
import { usePonderState } from "./usePonderState";
import { useQueuedTxs } from "./useQueuedOrders";
import { useSafeApp } from "./useSafeApp";

type TxDetailsWithSafeTxHash = GatewayTransactionDetails & {
  safeTxHash: `0x${string}`;
};
interface TxManagerState {
  toBeExecutedSafeTxs: TxDetailsWithSafeTxHash[];
  toBeIndexedSafeTxs: {
    safeTx: TxDetailsWithSafeTxHash;
    blockNumber: number;
  }[];
}

interface TxManagerActions {
  setToBeExecutedSafeTxs: (
    toBeExecutedSafeTxs: TxDetailsWithSafeTxHash[],
  ) => void;
  setToBeIndexedSafeTxs: (
    toBeIndexedSafeTxs: {
      safeTx: TxDetailsWithSafeTxHash;
      blockNumber: number;
    }[],
  ) => void;
}

const useTxManagerStore = create<TxManagerState & TxManagerActions>()(
  persist(
    (set) => ({
      toBeExecutedSafeTxs: [],
      toBeIndexedSafeTxs: [],
      setToBeExecutedSafeTxs: (toBeExecutedSafeTxs) =>
        set({ toBeExecutedSafeTxs }),
      setToBeIndexedSafeTxs: (toBeIndexedSafeTxs) =>
        set({ toBeIndexedSafeTxs }),
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
    toBeExecutedSafeTxs,
    toBeIndexedSafeTxs,
    setToBeExecutedSafeTxs,
    setToBeIndexedSafeTxs,
  ] = useTxManagerStore((state) => [
    state.toBeExecutedSafeTxs,
    state.toBeIndexedSafeTxs,
    state.setToBeExecutedSafeTxs,
    state.setToBeIndexedSafeTxs,
  ]);

  const [removeCreatingOrders] = useCreatingOrders((state) => [
    state.removeCreatingOrders,
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
    return safeTxHash as `0x${string}`;
  };

  const updateTxStates = async () => {
    const updatedTxStates = await Promise.all(
      toBeExecutedSafeTxs.map(async ({ safeTxHash }) => {
        const updatedTx = await sdk.txs.getBySafeTxHash(safeTxHash);
        return { ...updatedTx, safeTxHash };
      }),
    );

    const toBeIndexedNewTxs = updatedTxStates.filter(
      (tx) => TransactionStatus.SUCCESS == tx?.txStatus,
    );

    const newBlockNumbers = await Promise.all(
      toBeIndexedNewTxs.map(async ({ txHash }) => {
        const transaction = await publicClient.getTransaction({
          hash: txHash as `0x${string}`,
        });
        return Number(transaction.blockNumber);
      }),
    );

    if (toBeIndexedNewTxs.length > 0) {
      setToBeIndexedSafeTxs(
        toBeIndexedNewTxs.map((tx, index) => ({
          safeTx: tx,
          blockNumber: newBlockNumbers[index],
        })),
      );
    }

    const remainingSafeTxs = updatedTxStates.filter((tx) =>
      [
        TransactionStatus.AWAITING_CONFIRMATIONS,
        TransactionStatus.AWAITING_EXECUTION,
      ].includes(tx?.txStatus),
    );

    if (remainingSafeTxs.length !== toBeExecutedSafeTxs.length) {
      setToBeExecutedSafeTxs(remainingSafeTxs);
    }
  };

  const updateTxBlockNumbers = async () => {
    if (toBeIndexedSafeTxs.length === 0) return;
    const ponderNewBlockNumber = await mutatePonder();
    const toBeCatchBlockNumbers = toBeIndexedSafeTxs.filter(
      ({ blockNumber }) => blockNumber + 3 > (ponderNewBlockNumber || 0),
    );
    const toBeRemovedBlockNumbers = toBeIndexedSafeTxs.filter(
      ({ blockNumber }) => blockNumber + 3 <= (ponderNewBlockNumber || 0),
    );
    if (toBeRemovedBlockNumbers.length > 0) {
      setToBeIndexedSafeTxs(toBeCatchBlockNumbers);
      removeCreatingOrders(
        toBeRemovedBlockNumbers.map(({ safeTx: { safeTxHash } }) => safeTxHash),
      );
      mutateOrdersQueue();
      mutateOrdersList();
    }
  };

  const writeContract = async (txs: AllTransactionArgs[]) => {
    const safeTxHash = await sendTransactions(txs);
    const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash);
    setToBeExecutedSafeTxs([...toBeExecutedSafeTxs, { ...safeTx, safeTxHash }]);
    mutateOrdersQueue();
    return safeTxHash;
  };

  useEffect(() => {
    if (toBeExecutedSafeTxs.length === 0) return;
    const interval = setInterval(updateTxStates, 1_000);
    return () => clearInterval(interval);
  }, [toBeExecutedSafeTxs]);

  useEffect(() => {
    if (toBeIndexedSafeTxs.length === 0) return;
    const interval = setInterval(updateTxBlockNumbers, 1_000);
    return () => clearInterval(interval);
  }, [toBeIndexedSafeTxs]);

  return {
    writeContract,
  };
}
