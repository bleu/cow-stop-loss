import { Address } from "viem";
import { ChainId } from "../publicClients";
import { fetchComposableCoWQueuedTxs } from "./fetchComposableCoWQueuedTx";
import { COMPOSABLE_COW_ADDRESS } from "../contracts";

export async function fetchOrderHashOfRemoveQueuedTxs({
  chainId,
  address,
}: {
  chainId: ChainId;
  address: Address;
}): Promise<`0x${string}`[]> {
  const composableCowQueuedTxs = await fetchComposableCoWQueuedTxs({
    chainId,
    address,
  });
  const stopLossTxs = composableCowQueuedTxs.filter((tx) => {
    if (
      tx.txData?.to.value.toLowerCase() === COMPOSABLE_COW_ADDRESS.toLowerCase()
    ) {
      return tx.txData.dataDecoded?.method === "remove";
    }
    if (tx.txData?.dataDecoded?.method === "multiSend") {
      return tx.txData.dataDecoded.parameters?.[0].valueDecoded?.some(
        (value) => {
          return (
            value.to?.toLowerCase() === COMPOSABLE_COW_ADDRESS.toLowerCase() &&
            value.dataDecoded?.method === "remove"
          );
        }
      );
    }
    return false;
  });

  return stopLossTxs
    .map((tx) => {
      if (
        tx.txData?.to.value.toLowerCase() ===
          COMPOSABLE_COW_ADDRESS.toLowerCase() &&
        tx.txData.dataDecoded?.method === "remove"
      ) {
        return [tx.txData.dataDecoded?.parameters?.[0].value as `0x${string}`];
      }
      if (tx.txData?.dataDecoded?.method === "multiSend") {
        return (
          tx.txData.dataDecoded.parameters?.[0].valueDecoded
            ?.filter((value) => {
              return (
                value.to?.toLowerCase() ===
                  COMPOSABLE_COW_ADDRESS.toLowerCase() &&
                value.dataDecoded?.method === "remove"
              );
            })
            .map((value) => {
              return value.dataDecoded?.parameters?.[0].value as `0x${string}`;
            }) || ([] as `0x${string}`[] as `0x${string}`[])
        );
      }
      return [] as `0x${string}`[];
    })
    .flat();
}
