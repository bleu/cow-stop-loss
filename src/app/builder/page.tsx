"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { Edge, Node } from "reactflow";
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

  useEffect(() => {
    getOrderDefaultNodesAndEdges(chainId as ChainId, safeAddress as Address, [
      submitNode,
    ]).then(({ orderEdges, orderNodes }) => {
      setInitNodes([submitNode, ...orderNodes]);
      setInitEdges(orderEdges);
    });
  }, [chainId, safeAddress]);

  if (initNodes.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="hidden h-full flex-col md:flex text-background">
      <div className="size-full py-6 px-3">
        <div className="flex h-full gap-6">
          <div
            className={`flex-col space-y-4 bg-foreground rounded-md text-primary-foreground md:order-2 w-72 p-3`}
          >
            <Menu />
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
