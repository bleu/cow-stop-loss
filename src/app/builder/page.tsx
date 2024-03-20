"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { Edge, Node, useNodes } from "reactflow";
import { Address } from "viem";

import { Board } from "#/components/Board";
import Menu from "#/components/menus";
import { defaultNodeProps } from "#/components/nodes";
import { Spinner } from "#/components/Spinner";
import { getOrderDefaultNodesAndEdges } from "#/lib/getOrderDefaultData";
import { ChainId } from "#/lib/publicClients";
import { IEdgeData, INodeData } from "#/lib/types";

const submitNode: Node<INodeData> = {
  id: "submit",
  type: "submitNode",
  selectable: false,
  ...defaultNodeProps,
  data: undefined,
};

export default function Page() {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();
  const [initNodes, setInitNodes] = useState<Node<INodeData>[]>([]);
  const [initEdges, setInitEdges] = useState<Edge<IEdgeData>[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const nodes = useNodes();

  useEffect(() => {
    getOrderDefaultNodesAndEdges(chainId as ChainId, safeAddress as Address, [
      submitNode,
    ]).then(({ orderEdges, orderNodes }) => {
      setInitNodes([submitNode, ...orderNodes]);
      setInitEdges(orderEdges);
    });
  }, [chainId, safeAddress]);

  useEffect(() => {
    setMenuVisible(nodes.some((node) => node.selected));
  }, [nodes]);

  if (initNodes.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="hidden h-full flex-col md:flex text-white">
      <div className="container size-full py-6">
        <div className="flex h-full items-stretch gap-6">
          <div
            className={`flex-col space-y-4 sm:flex md:order-2 transition-all duration-500 ${menuVisible ? "w-72 translate-x-0" : "w-0 translate-x-full"}`}
          >
            {menuVisible && <Menu />}
          </div>
          <div className={`flex flex-col flex-1`}>
            <div className="flex h-full flex-col space-y-4">
              <div className="h-full">
                <Board initNodes={initNodes} initEdges={initEdges} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
