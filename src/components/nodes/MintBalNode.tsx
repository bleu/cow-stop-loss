import { Address } from "viem";

import { balancerGaugesApi } from "#/lib/gql/client";
import { ChainId } from "#/lib/publicClients";
import { HOOK_TYPES, IMintBalData } from "#/lib/types";

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

export async function getDefaultMintBalData(
  chainId: ChainId,
  safeAddress: Address
) {
  const gaugesShares = await balancerGaugesApi
    .gql(chainId)
    .GaugeSharesByUser({ user: safeAddress.toLowerCase() });

  const liveGauges = gaugesShares.gaugeShares
    .filter(({ gauge }) => !gauge.isKilled)
    .map(({ gauge }) => gauge.id);

  return {
    chainId: chainId,
    safeAddress: safeAddress,
    type: HOOK_TYPES.MINT_BAL,
    gauges: liveGauges,
  } as IMintBalData;
}
