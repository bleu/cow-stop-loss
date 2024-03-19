import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { useNodes } from "reactflow";

import { IHooks, INodeData, IStopLossRecipeData } from "#/lib/types";

export function useRecipeData(): {
  recipeData?: IStopLossRecipeData;
  loaded: boolean;
} {
  const { safe } = useSafeAppsSDK();
  const [recipeData, setRecipeData] = useState<IStopLossRecipeData>();
  const [loaded, setLoaded] = useState(false);
  const nodes = useNodes<INodeData>();

  useEffect(() => {
    const recipeData = {
      ...(nodes.find((node) => node.id === "condition")
        ?.data as IStopLossRecipeData),
      ...(nodes.find((node) => node.id === "swap")
        ?.data as IStopLossRecipeData),
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

    setRecipeData({
      ...recipeData,
      preHooks: preHooksData,
      postHooks: postHooksData,
      safeInfo: safe,
    } as IStopLossRecipeData);

    setLoaded(true);
  }, [safe, nodes]);

  return { recipeData, loaded };
}
