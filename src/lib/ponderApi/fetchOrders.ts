import request from "graphql-request";
import { NEXT_PUBLIC_API_URL } from ".";
import { ORDER_QUERY, USER_ORDERS_QUERY } from "./queries";
import { IStopLossPonder, OrderStatus, StopLossOrderType } from "../types";
import { ChainId, publicClientsFromIds } from "../publicClients";
import { composableCowAbi } from "../abis/composableCow";
import { COMPOSABLE_COW_ADDRESS } from "../contracts";
import { getCowOrderByUid } from "../cowApi/fetchCowOrder";

export const getProcessedStopLossOrder = async ({
  orderId,
  userAddress,
  chainId,
}: {
  orderId: string;
  userAddress: string;
  chainId: ChainId;
}): Promise<StopLossOrderType> => {
  const { order } = await request(NEXT_PUBLIC_API_URL, ORDER_QUERY, {
    orderId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const [orderCanceled, relatedCoWOrder] = await Promise.all([
    fetchOrdersCancellations([order?.hash || ""], chainId, userAddress),
    getCowOrderByUid(
      order?.stopLossData?.orderUid as `0x${string}`,
      chainId
    ).catch(() => undefined),
  ]);

  return {
    ...order,
    status: getOrderStatus(order, orderCanceled[0]),
    cowOrder: relatedCoWOrder,
    canceled: orderCanceled[0],
  };
};

export const getProcessedStopLossOrders = async ({
  userAddress,
  chainId,
}: {
  userAddress: string;
  chainId: ChainId;
}): Promise<StopLossOrderType[]> => {
  const { orders } = await request(NEXT_PUBLIC_API_URL, USER_ORDERS_QUERY, {
    userId: `${userAddress}-${chainId}`,
  });

  const ordersCancellations = await fetchOrdersCancellations(
    orders.items.map((order) => order.hash) as string[],
    chainId,
    userAddress
  );

  return orders.items.map((order, index) => {
    const orderCanceled = ordersCancellations[index];
    const status = getOrderStatus(order, orderCanceled);
    return { ...order, status, canceled: orderCanceled };
  });
};

export const fetchOrdersCancellations = async (
  orderHashs: string[],
  chainId: ChainId,
  ownerAddress: string
): Promise<boolean[]> => {
  const publicClient = publicClientsFromIds[chainId];
  const multicallResults = await publicClient.multicall({
    contracts: orderHashs.map((orderHash) => ({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "singleOrders",
      args: [ownerAddress, orderHash],
    })),
  });
  return multicallResults.map((result) => !result?.result);
};

const getOrderStatus = (
  order: IStopLossPonder,
  orderCanceled: boolean
): OrderStatus => {
  if (!order?.stopLossData) return OrderStatus.OPEN;

  const filledPctBps = BigInt(order.stopLossData.filledPctBps as bigint);
  const isValid = Number(order.stopLossData.validTo) * 1000 > Date.now();

  if (filledPctBps >= BigInt(1_000_000)) return OrderStatus.FULFILLED;
  if (filledPctBps > BigInt(0)) {
    if (orderCanceled) return OrderStatus.PARTIALLY_FILLED_AND_CANCELLED;
    if (!isValid) return OrderStatus.PARTIALLY_FILLED_AND_EXPIRED;
    return OrderStatus.PARTIALLY_FILLED;
  }
  if (orderCanceled) return OrderStatus.CANCELLED;
  if (!isValid) return OrderStatus.EXPIRED;
  return OrderStatus.OPEN;
};
