import { Address } from "viem";
import { getCowOrders } from "./cowApi/fetchCowOrder";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { composableCowApi } from "./gql/client";
import { COMPOSABLE_COW_ADDRESS } from "./contracts";
import { composableCowAbi } from "./abis/composableCow";
import {
  CowOrder,
  OrderStatus,
  StopLossOrderType,
  StopLossOrderTypeWithCowOrders,
} from "./types";

export async function getProcessedStopLossOrder({
  orderId,
  chainId,
  address,
}: {
  orderId: string;
  chainId: ChainId;
  address: Address;
}): Promise<StopLossOrderTypeWithCowOrders | undefined> {
  const publicClient = publicClientsFromIds[chainId];
  const rawOrderData = await composableCowApi.gql(chainId).OrderById({
    orderId: orderId,
  });
  if (!rawOrderData?.order?.stopLossData || !rawOrderData?.order?.hash) return;
  const cowOrders =
    (await getRelatedCowOrders({
      address,
      chainId,
      appData: rawOrderData.order.stopLossData.appData,
    })) || [];
  const singleOrderResult = await publicClient.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "singleOrders",
    args: [address, rawOrderData?.order?.hash as `0x${string}`],
  });

  const executedSellAmount = cowOrders?.reduce(
    (acc, cowOrder) => acc + Number(cowOrder.executedSellAmount),
    0,
  );

  const executedBuyAmount = cowOrders?.reduce(
    (acc, cowOrder) => acc + Number(cowOrder.executedBuyAmount),
    0,
  );

  const filledPct = rawOrderData?.order?.stopLossData?.isSellOrder
    ? executedSellAmount /
      Number(rawOrderData?.order?.stopLossData?.tokenAmountIn)
    : executedBuyAmount /
      Number(rawOrderData?.order?.stopLossData?.tokenAmountOut);

  const orderWithoutStatus = {
    ...rawOrderData.order,
    executedBuyAmount: String(executedBuyAmount),
    executedSellAmount: String(executedSellAmount),
    singleOrder: singleOrderResult,
    filledPct,
  };
  const status = getOrderStatus({
    order: orderWithoutStatus,
  });
  return {
    ...orderWithoutStatus,
    status,
    cowOrders: cowOrders,
  };
}

export async function getProcessedStopLossOrders({
  chainId,
  address,
}: {
  chainId: ChainId;
  address: Address;
}): Promise<StopLossOrderType[]> {
  const publicClient = publicClientsFromIds[chainId];
  const rawOrdersData = await composableCowApi.gql(chainId).UserStopLossOrders({
    user: `${address}-${chainId}`,
  });
  const cowOrders = await getCowOrders(address, chainId);

  if (!rawOrdersData?.orders?.items) {
    return [];
  }

  const multicallResults = await publicClient.multicall({
    contracts: rawOrdersData.orders.items.map((order) => ({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "singleOrders",
      args: [address, order.hash],
    })),
  });

  const ordersWithStatus = rawOrdersData.orders.items.map((order, index) => {
    const cowOrdersMatch = cowOrders.filter(
      (cowOrder) => cowOrder.appData === order.stopLossData?.appData,
    );
    const singleOrderResult = multicallResults[index]?.result;

    const executedSellAmount = cowOrdersMatch?.reduce(
      (acc, cowOrder) => acc + Number(cowOrder.executedSellAmount),
      0,
    );

    const executedBuyAmount = cowOrdersMatch?.reduce(
      (acc, cowOrder) => acc + Number(cowOrder.executedBuyAmount),
      0,
    );

    const filledPct = order.stopLossData?.isSellOrder
      ? executedSellAmount / Number(order.stopLossData?.tokenAmountIn)
      : executedBuyAmount / Number(order.stopLossData?.tokenAmountOut);

    const orderWithoutStatus = {
      ...order,
      executedBuyAmount: String(executedBuyAmount),
      executedSellAmount: String(executedSellAmount),
      singleOrder: singleOrderResult,
      filledPct,
    };

    const status = getOrderStatus({
      order: orderWithoutStatus,
    });

    return {
      ...orderWithoutStatus,
      status,
    };
  });
  return ordersWithStatus;
}

export async function getRelatedCowOrders({
  appData,
  address,
  chainId,
}: {
  appData: string;
  address: Address;
  chainId: ChainId;
}): Promise<CowOrder[] | undefined> {
  const cowOrders = await getCowOrders(address, chainId);
  return cowOrders.filter((order) => order.appData === appData);
}

export function getOrderStatus({
  order,
}: {
  order: Omit<StopLossOrderType, "status">;
}): OrderStatus {
  if (!order.filledPct && !order.singleOrder) return "canceled";

  if (!order.filledPct) return "open";

  if (order.filledPct >= 1) return "fulfilled";

  return "partiallyFilled";
}
