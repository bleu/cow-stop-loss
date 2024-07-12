"use client";

import { ArrowTopRightIcon } from "@radix-ui/react-icons";

import { useSafeApp } from "#/hooks/useSafeApp";
import { ChainId } from "#/lib/publicClients";
import { truncateAddress } from "#/utils";

import { BlockExplorerLink } from "./ExplorerLink";

export function AddressWithLink({ address }: { address: string }) {
  const { chainId } = useSafeApp();
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
