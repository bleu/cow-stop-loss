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
          <div className="text-sm font-bold">Mint BAL</div>
          <div className="text-xs text-gray-500">
            {`Mint all BAL from ${data.gauges.length} gauges`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
