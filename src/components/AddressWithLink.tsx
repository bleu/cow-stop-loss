"use client";

import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";

import { ChainId } from "#/lib/publicClients";
import { truncateAddress } from "#/utils";

import { BlockExplorerLink } from "./ExplorerLink";

export function AddressWithLink({ address }: { address: string }) {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  return (
    <div className="flex gap-1 items-center">
      <span>{truncateAddress(address)}</span>
      <BlockExplorerLink
        type="address"
        label={<ArrowTopRightIcon />}
        identifier={address}
        networkId={chainId as ChainId}
      />
    </div>
  );
}
