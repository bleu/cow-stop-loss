import request from "graphql-request";
import { NEXT_PUBLIC_API_URL } from ".";
import { ORDER_QUERY, USER_ORDERS_QUERY } from "./queries";
import { OrderStatus, StopLossOrderType } from "../types";
import { ChainId, publicClientsFromIds } from "../publicClients";
import { composableCowAbi } from "../abis/composableCow";
import { COMPOSABLE_COW_ADDRESS } from "../contracts";
import { getCowOrderByUid } from "../cowApi/fetchCowOrder";
import { fetchOrderHashOfRemoveQueuedTxs } from "../txQueue/fetchRemoveQueuedTxs";
import { Address } from "viem";
import { fetchCreateQueuedOrders } from "../txQueue/fetchCreateQueuedOrders";

export const getProcessedStopLossOrder = async ({
  orderId,
  userAddress,
  chainId,
}: {
  orderId: string;
  userAddress: string;
  chainId: ChainId;
}): Promise<StopLossOrderType> => {
  const [order, cancellingOrdersHashs] = await Promise.all([
    fetchOrderWithCancellation(chainId, userAddress, orderId),
    fetchOrderHashOfRemoveQueuedTxs({
      chainId,
      address: userAddress as Address,
    }),
  ]);

  return {
    ...order,
    status: getOrderStatus(order, cancellingOrdersHashs),
  };
};

export const getProcessedStopLossOrders = async ({
  userAddress,
  chainId,
}: {
  userAddress: string;
  chainId: ChainId;
}): Promise<StopLossOrderType[]> => {
  const [ordersWithoutStatus, cancellingOrdersHashs] = await Promise.all([
    fetchOrdersWithCancellations(chainId, userAddress),
    fetchOrderHashOfRemoveQueuedTxs({
      chainId,
      address: userAddress as Address,
    }),
  ]);

  const queuedCreatedOrders = await fetchCreateQueuedOrders({
    chainId,
    address: userAddress as Address,
  });

  return [
    ...ordersWithoutStatus.map((order) => {
      const status = getOrderStatus(order, cancellingOrdersHashs);
      return { ...order, status };
    }),
    ...queuedCreatedOrders,
  ];
};

export const fetchOrdersCancellations = async (
  orderHashs: string[],
  chainId: ChainId,
  ownerAddress: string,
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

const fetchOrdersWithCancellations = async (
  chainId: ChainId,
  userAddress: string,
): Promise<Omit<StopLossOrderType, `status`>[]> => {
  const { orders } = await request(NEXT_PUBLIC_API_URL, USER_ORDERS_QUERY, {
    userId: `${userAddress}-${chainId}`,
  });
  const ordersCancellations = await fetchOrdersCancellations(
    orders.items.map((order) => order.hash) as string[],
    chainId,
    userAddress,
  );

  return orders.items.map((order, index) => {
    const orderCanceled = ordersCancellations[index];
    return { ...order, canceled: orderCanceled };
  });
};

const fetchOrderWithCancellation = async (
  chainId: ChainId,
  userAddress: string,
  orderId: string,
): Promise<Omit<StopLossOrderType, `status`>> => {
  const { order } = await request(NEXT_PUBLIC_API_URL, ORDER_QUERY, {
    orderId,
  });
  const [orderCanceled, relatedCoWOrder] = await Promise.all([
    fetchOrdersCancellations([order?.hash || ""], chainId, userAddress),
    getCowOrderByUid(
      order?.stopLossData?.orderUid as `0x${string}`,
      chainId,
    ).catch(() => undefined),
  ]);

  if (!order) {
    throw new Error("Order not found");
  }

  return {
    ...order,
    cowOrder: relatedCoWOrder,
    canceled: orderCanceled[0],
  };
};

const getOrderStatus = (
  order: Omit<StopLossOrderType, `status`>,
  cancellingOrdersHashs: string[],
): OrderStatus => {
  if (!order?.stopLossData) return OrderStatus.OPEN;

  const filledPctBps = BigInt(order.stopLossData.filledPctBps as bigint);
  const isValid = Number(order.stopLossData.validTo) * 1000 > Date.now();
  const isCancelling = cancellingOrdersHashs.includes(order.hash as string);

  if (filledPctBps >= BigInt(1_000_000)) return OrderStatus.FULFILLED;
  if (filledPctBps > BigInt(0)) {
    if (order.canceled) return OrderStatus.PARTIALLY_FILLED_AND_CANCELLED;
    if (!isValid) return OrderStatus.PARTIALLY_FILLED_AND_EXPIRED;
    if (isCancelling) return OrderStatus.PARTIALLY_FILLED_AND_CANCELLING;
    return OrderStatus.PARTIALLY_FILLED;
  }
  if (order.canceled) return OrderStatus.CANCELLED;
  if (isCancelling) return OrderStatus.CANCELLING;
  if (!isValid) return OrderStatus.EXPIRED;
  return OrderStatus.OPEN;
};
