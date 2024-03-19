import { useNodes } from "reactflow";

import { useRecipeData } from "#/hooks/useRecipeData";
import { INodeData } from "#/lib/types";

import { Spinner } from "../Spinner";
import { MintBalMenu } from "./MintBalMenu";
import { MultiSendMenu } from "./MultiSendMenu";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { SwapMenu } from "./SwapMenu";

export default function Menu() {
  const nodeMenus = {
    stopLoss: StopLossConditionMenu,
    swap: SwapMenu,
    hookMultiSend: MultiSendMenu,
    hookMintBal: MintBalMenu,
  };

  const { recipeData } = useRecipeData();
  const nodes = useNodes<INodeData>();
  const selected = nodes.find((node) => node.selected);

  if (!recipeData) {
    return <Spinner />;
  }

  if (!selected || !nodeMenus[selected?.type as keyof typeof nodeMenus]) {
    return null;
  }
  const MenuComponent = nodeMenus[selected?.type as keyof typeof nodeMenus];

  return (
    <MenuComponent
      data={recipeData}
      id={selected.id}
      defaultValues={selected.data}
    />
  );
}
