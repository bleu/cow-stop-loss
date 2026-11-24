import Image from "next/image";

import { CHAIN_ASSETS } from "#/lib/chainAssets";
import type { WalletChainId } from "#/lib/publicClients";

export function NetworkLogo({
  chainId,
  size = 22,
  className,
}: {
  chainId: WalletChainId;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={CHAIN_ASSETS[chainId].icon}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
