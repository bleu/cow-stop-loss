import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { Node, useNodes } from "reactflow";
import { Address } from "viem";

import { FALLBACK_STATES, useFallbackState } from "#/hooks/useFallbackState";
import { useRawTxData } from "#/hooks/useRawTxData";
import { createRawTxArgs } from "#/lib/transactionFactory";
import { IHooks, INodeData, IStopLossRecipeData } from "#/lib/types";

import { AlertCard } from "../AlertCard";
import Button from "../Button";
import { Checkbox } from "../Checkbox";
import { Spinner } from "../Spinner";
import { MintBalMenu } from "./MintBalMenu";
import { MultiSendMenu } from "./MultiSendMenu";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { StopLossRecipeMenu } from "./StopLossRecipeMenu";
import { SwapMenu } from "./SwapMenu";

export default function Menu() {
  const nodeMenus = {
    stopLoss: StopLossConditionMenu,
    swap: SwapMenu,
    hookMultiSend: MultiSendMenu,
    hookMintBal: MintBalMenu,
  };

  const { safe } = useSafeAppsSDK();
  const [recipeData, setRecipeData] = useState<IStopLossRecipeData>();
  const nodes = useNodes<INodeData>();
  const selected = nodes.find((node) => node.selected);

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
  }, [nodes]);

  if (!recipeData) {
    return <Spinner />;
  }

  if (!selected || !nodeMenus[selected?.type as keyof typeof nodeMenus]) {
    return <DefaultMenu data={recipeData} />;
  }

  return (
    <SelectedMenu data={recipeData} selected={selected} nodeMenus={nodeMenus} />
  );
}

function DefaultMenu({ data }: { data: IStopLossRecipeData }) {
  const {
    safe: { safeAddress },
  } = useSafeAppsSDK();
  const { sendTransactions } = useRawTxData();
  const { fallbackState, domainSeparator } = useFallbackState();
  const needFallbackSetting =
    fallbackState === FALLBACK_STATES.HAS_NOTHING ||
    fallbackState === FALLBACK_STATES.HAS_EXTENSIBLE_FALLBACK;
  const [fallbackSetupApprove, setFallbackSetupApprove] = useState(false);

  if (!domainSeparator) {
    return <Spinner />;
  }

  const createOrder = async () => {
    await sendTransactions(
      createRawTxArgs({
        data,
        safeAddress: safeAddress as Address,
        domainSeparator,
        fallbackState: fallbackState as FALLBACK_STATES,
      })
    );
  };

  return (
    <div>
      <div className="flex flex-col m-2 w-full max-h-[39rem] overflow-y-scroll gap-y-2">
        <StopLossRecipeMenu data={data} />
        {needFallbackSetting && (
          <AlertCard style="warning" title="Fallback Setting">
            <span>
              To create the order you need to set the Composable CoW as the
              domain verifier and the Extensible Fallback as the fallback
              handler.
            </span>
            <Checkbox
              id="setFallbackHandler"
              checked={fallbackSetupApprove}
              onChange={() => setFallbackSetupApprove(!fallbackSetupApprove)}
              label="Approve fallback setup"
            />
          </AlertCard>
        )}
        <Button
          type={"submit"}
          disabled={
            (needFallbackSetting && !fallbackSetupApprove) || data.oracleError
          }
          onClick={createOrder}
        >
          Create Order
        </Button>
      </div>
    </div>
  );
}

function SelectedMenu({
  selected,
  data,
  nodeMenus,
}: {
  selected: Node<INodeData>;
  data: IStopLossRecipeData;
  nodeMenus: Record<
    string,
    React.FC<{
      data: IStopLossRecipeData;
      id: string;
      defaultValues: INodeData;
    }>
  >;
}) {
  const MenuComponent = nodeMenus[selected?.type as keyof typeof nodeMenus];

  return (
    <MenuComponent data={data} id={selected.id} defaultValues={selected.data} />
  );
}
