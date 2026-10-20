import Image from "next/image";

import { CHAIN_INFO } from "#/lib/chainInfo";
import { ChainId } from "#/lib/publicClients";

export function NetworkLogo({
  chainId,
  size = 22,
  className,
}: {
  chainId: ChainId;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={CHAIN_INFO[chainId].icon}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
