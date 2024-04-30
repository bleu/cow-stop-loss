import { Cross1Icon } from "@radix-ui/react-icons";
import { useReactFlow } from "reactflow";

import { IMintBalData } from "#/lib/types";

import { BaseNode } from ".";

export function MintBalNode({
  id,
  selected,
  data,
}: {
  id: string;
  selected: boolean;
  data: IMintBalData;
}) {
  const { deleteElements } = useReactFlow();
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col ml-2">
        <div className="flex flex-row justify-between">
          <div className="text-sm font-bold text-highlight">Mint BAL</div>
          <button
            className="text-background hover:text-destructive"
            onClick={() => {
              deleteElements({
                nodes: [{ id }],
              });
            }}
          >
            <Cross1Icon className="size-3" />
          </button>
        </div>
        <div className="text-xs">
          {`Mint all BAL from ${data.gauges.length} gauge${data.gauges.length > 1 ? "s" : ""}`}
        </div>
      </div>
    </BaseNode>
  );
}
