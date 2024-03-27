import { useNodes } from "reactflow";

import { useRecipeData } from "#/hooks/useRecipeData";
import { INodeData } from "#/lib/types";

import { Spinner } from "../Spinner";
import { MintBalMenu } from "./MintBalMenu";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { SwapMenu } from "./SwapMenu";

export default function Menu() {
  const nodeMenus = {
    stopLoss: StopLossConditionMenu,
    swap: SwapMenu,
    hookMintBal: MintBalMenu,
  };

  const { getOrderDataByOrderId, loaded } = useRecipeData();
  const nodes = useNodes<INodeData>();

  if (!loaded) {
    return <Spinner />;
  }
  const selected = nodes.find((node) => node.selected);

  if (
    !selected ||
    !selected.data ||
    !nodeMenus[selected?.type as keyof typeof nodeMenus]
  ) {
    return null;
  }
  const MenuComponent = nodeMenus[selected?.type as keyof typeof nodeMenus];
  const orderData = getOrderDataByOrderId(selected.data.orderId);

  if (!orderData) {
    return null;
  }

  return (
    <MenuComponent
      data={orderData}
      id={selected.id}
      defaultValues={selected.data}
    />
  );
}
