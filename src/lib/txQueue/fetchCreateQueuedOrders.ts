import { Address } from "viem";
import { ChainId } from "../publicClients";
import { fetchComposableCoWQueuedTxs } from "./fetchComposableCoWQueuedTx";
import { COMPOSABLE_COW_ADDRESS, STOP_LOSS_ADDRESS } from "../contracts";
import { decodeComposableCowCreateTxData } from "../staticInputDecoder";
import { IToken, OrderStatus, StopLossOrderType } from "../types";
import { fetchTokenInfo } from "../tokenUtils";

export async function fetchCreateQueuedOrders({
  chainId,
  address,
}: {
  chainId: ChainId;
  address: Address;
}): Promise<StopLossOrderType[]> {
  const composableCowQueuedTxs = await fetchComposableCoWQueuedTxs({
    chainId,
    address,
  });
  const stopLossCreateTxs = composableCowQueuedTxs.filter((tx) => {
    if (tx.txData?.dataDecoded?.method != "multiSend") return false;
    return tx.txData.dataDecoded.parameters?.[0].valueDecoded?.some((value) => {
      return (
        value.to?.toLowerCase() === COMPOSABLE_COW_ADDRESS.toLowerCase() &&
        value.dataDecoded?.method === "create" &&
        value.dataDecoded?.parameters?.[0].value[0] === STOP_LOSS_ADDRESS
      );
    });
  });
  const decodedTxs = stopLossCreateTxs
    .map((tx) => {
      return (
        tx.txData?.dataDecoded?.parameters?.[0].valueDecoded?.filter(
          (value) => {
            return (
              value.to?.toLowerCase() ===
                COMPOSABLE_COW_ADDRESS.toLowerCase() &&
              value.dataDecoded?.method === "create"
            );
          }
        ) || []
      );
    })
    .flat();

  const decodedArgsList = decodedTxs.map((tx) =>
    decodeComposableCowCreateTxData(tx.data as `0x${string}`)
  );

  const allTokensSet = new Set(
    decodedArgsList
      .map((args) => {
        return [args.buyToken, args.sellToken];
      })
      .flat()
  );

  const tokensInfo = await Promise.all(
    Array.from(allTokensSet).map(async (token) => {
      return fetchTokenInfo(token, chainId);
    })
  );

  return decodedArgsList.map((args, index) => {
    const tokenSell = tokensInfo.find(
      (token) => token.address.toLowerCase() === args.sellToken.toLowerCase()
    ) as IToken;

    const tokenBuy = tokensInfo.find(
      (token) => token.address.toLowerCase() === args.buyToken.toLowerCase()
    ) as IToken;

    return {
      blockTimestamp: undefined,
      status: OrderStatus.ON_QUEUE,
      userAddress: address,
      chainId,
      uid: "",
      id: `creating-${decodedTxs[index].data}`,
      txHash: "",
      hash: "",
      canceled: false,
      stopLossData: {
        orderUid: "",
        buyTokenPriceOracle: args.buyTokenPriceOracle,
        isPartiallyFillable: args.isPartiallyFillable,
        isSellOrder: args.isSellOrder,
        maxTimeSinceLastOracleUpdate: args.maxTimeSinceLastOracleUpdate,
        orderId: "",
        sellTokenPriceOracle: args.sellTokenPriceOracle,
        strike: args.strike,
        to: args.receiver,
        tokenBuyAmount: args.buyAmount,
        executedTokenBuyAmount: BigInt(0),
        tokenSellAmount: args.sellAmount,
        executedTokenSellAmount: BigInt(0),
        validTo: args.validTo,
        filledPctBps: BigInt(0),
        tokenSell,
        tokenBuy,
      },
    };
  });
}
