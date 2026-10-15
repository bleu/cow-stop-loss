import Image from "next/image";

import { ChainId } from "#/lib/publicClients";

const networkAssets: Record<ChainId, { src: string }> = {
  1: { src: "/assets/networks/ethereum.svg" },
  100: { src: "/assets/networks/gnosis.svg" },
  42161: { src: "/assets/networks/arbitrum.svg" },
  11155111: { src: "/assets/networks/sepolia.svg" },
};

export function NetworkLogo({
  chainId,
  size = 22,
  className,
}: {
  chainId: ChainId;
  size?: number;
  className?: string;
}) {
  const asset = networkAssets[chainId];
  return (
    <Image
      src={asset.src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
