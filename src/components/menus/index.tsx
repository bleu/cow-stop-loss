import { useEffect, useState } from "react";
import { FieldValues } from "react-hook-form";
import { Node, useNodes } from "reactflow";

import { useBuilder } from "#/contexts/builder";
import { INodeData, IStopLossRecipeData } from "#/lib/types";

import { Spinner } from "../Spinner";
import { MintBalMenu } from "./MintBalMenu";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { SwapMenu } from "./SwapMenu";

export default function Menu() {
  const nodes = useNodes<INodeData>();

  const selected = nodes.find((node) => node.selected);

  if (!selected || !selected.data) {
    return <DefaultMenu />;
  }

  return (
    <div className="w-full max-h-[39rem] overflow-y-scroll">
      <div className="pr-3">
        <MenuComponentWrapper
          selected={selected}
          defaultValues={selected.data}
        />
      </div>
    </div>
  );
}

function MenuComponentWrapper({
  selected,
  defaultValues,
}: {
  defaultValues: FieldValues;
  selected?: Node<INodeData>;
}) {
  const { getOrderDataByOrderId } = useBuilder();
  const [orderData, setOrderData] = useState<IStopLossRecipeData>();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    if (selected?.id === selectedId) return;
    setSelectedId(selected?.id);
    if (selected && selected?.data) {
      setLoading(true);
      const orderData = getOrderDataByOrderId(selected?.data.orderId);
      setOrderData(orderData);
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  }, [selected]);

  if (!selected || !selected.data) {
    return <DefaultMenu />;
  }

  if (!orderData || loading) {
    return <Spinner />;
  }

  if (selected.type === "stopLoss") {
    return (
      <StopLossConditionMenu
        id={selected.id}
        data={orderData}
        defaultValues={defaultValues}
      />
    );
  }
  if (selected.type === "swap") {
    return (
      <SwapMenu
        id={selected.id}
        data={orderData}
        defaultValues={defaultValues}
      />
    );
  }
  if (selected.type === "hookMintBal") {
    return <MintBalMenu id={selected.id} defaultValues={defaultValues} />;
  }
  return <DefaultMenu />;
}

function DefaultMenu() {
  return (
    <div className="flex flex-col w-full pr-3">
      <span className="text-lg font-bold text-highlight">Nodes menu</span>
      <p>Select a node to see the menu and edit the parameters</p>
      <br />
      <p>
        If you want to delete one order node, select it and press on the cross
        icon
      </p>
    </div>
  );
}
