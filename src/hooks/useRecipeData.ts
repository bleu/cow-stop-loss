import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { useNodes } from "reactflow";

import { IHooks, INodeData, IStopLossRecipeData } from "#/lib/types";

export function useRecipeData(): {
  ordersData?: IStopLossRecipeData[];
  loading: boolean;
  getOrderDataByOrderId: (orderId: number) => IStopLossRecipeData | undefined;
} {
  const { safe } = useSafeAppsSDK();
  const [ordersData, setOrdersData] = useState<IStopLossRecipeData[]>([]);
  const [loading, setLoading] = useState(false);
  const nodes = useNodes<INodeData>();

  const getOrderDataByOrderId = (orderId: number) => {
    return ordersData.find((order) => order.orderId === orderId);
  };

  useEffect(() => {
    const orderIds = Array.from(
      new Set<number>(
        nodes
          .filter(({ data }) => data !== undefined)
          .map((node) => node.data?.orderId as number)
      )
    );

    setLoading(true);

    setOrdersData(
      orderIds.map((orderId) => {
        const orderNodes = nodes.filter(
          (node) => node.data?.orderId === orderId
        );

        const conditionNode = orderNodes.find(
          (node) => node.type === "stopLoss"
        );
        const swapNode = orderNodes.find((node) => node.type === "swap");

        const recipeData = {
          ...(conditionNode?.data as IStopLossRecipeData),
          ...(swapNode?.data as IStopLossRecipeData),
        };

        const preHooksData = nodes
          .filter((node) => node.id?.includes("preHook"))
          .reduce((acc, node) => {
            return [...acc, node.data as IHooks];
          }, [] as IHooks[]);

        const postHooksData = nodes
          .filter((node) => node.id?.includes("postHook"))
          .reduce((acc, node) => {
            return [...acc, node.data as IHooks];
          }, [] as IHooks[]);

        return {
          ...recipeData,
          preHooks: preHooksData,
          postHooks: postHooksData,
          safeInfo: safe,
        } as IStopLossRecipeData;
      })
    );

    setLoading(false);
  }, [safe, nodes]);

  return { ordersData, loading, getOrderDataByOrderId };
}
