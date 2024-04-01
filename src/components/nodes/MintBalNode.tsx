import { IMintBalData } from "#/lib/types";

import { BaseNode } from ".";

export function MintBalNode({
  selected,
  data,
}: {
  selected: boolean;
  data: IMintBalData;
}) {
  return (
    <BaseNode selected={selected}>
      <div className="flex">
        <div className="ml-2">
          <div className="text-sm font-bold text-highlight">Mint BAL</div>
          <div className="text-xs">
            {`Mint all BAL from ${data.gauges.length} gauge${data.gauges.length > 1 ? "s" : ""}`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
