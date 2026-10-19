"use client";

import Image from "next/image";
import { useState } from "react";
import { getAddress, isAddress } from "viem";

import { ChainId } from "#/lib/publicClients";
import { TOKEN_CATALOG } from "#/lib/tokenCatalog";

type ImageAttributes = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

type ImageFallbackProps = Omit<ImageAttributes, "src"> & {
  tokenAddress?: string;
  chainId?: ChainId;
  quality?: number;
};

const tokenUrlRoot =
  "https://raw.githubusercontent.com/cowprotocol/token-lists/main/src/public/images";

export const cowprotocolTokenLogoUrl = (address?: string, chainId?: ChainId) =>
  `${tokenUrlRoot}/${chainId}/${address}/logo.png`;

const chainIdToName: Record<ChainId, string> = {
  1: "ethereum",
  100: "xdai",
  11155111: "ethereum",
  42161: "arbitrum",
  8453: "base",
  137: "polygon",
  43114: "avalanchec",
  56: "smartchain",
  59144: "linea",
  9745: "plasma",
};

export function trustTokenLogoUrl(address?: string, chainId?: ChainId): string {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainIdToName[chainId || 1]}/assets/${address}/logo.png`;
}

const FALLBACK_SRC = "/assets/generic-token-logo.png";

function catalogTokenAsset(tokenAddress?: string, chainId?: ChainId) {
  return TOKEN_CATALOG.find(
    (token) =>
      token.chainId === chainId &&
      token.address.toLowerCase() === tokenAddress?.toLowerCase(),
  )?.logoURI;
}

export const TokenLogo = (props: ImageFallbackProps) => {
  const { tokenAddress, chainId } = props;
  const localAsset = catalogTokenAsset(tokenAddress, chainId);
  const address = tokenAddress?.toLowerCase();
  const checksumAddress =
    address && isAddress(address) ? getAddress(address) : undefined;
  const remoteAssets = checksumAddress
    ? [
        cowprotocolTokenLogoUrl(address, chainId),
        cowprotocolTokenLogoUrl(checksumAddress, chainId),
        cowprotocolTokenLogoUrl(address, 1),
        cowprotocolTokenLogoUrl(checksumAddress, 1),
        trustTokenLogoUrl(tokenAddress, chainId),
        trustTokenLogoUrl(address, chainId),
        trustTokenLogoUrl(checksumAddress, chainId),
        trustTokenLogoUrl(address, 1),
        trustTokenLogoUrl(checksumAddress, 1),
      ]
    : [];
  const imagesSrc = [
    ...new Set([
      ...(localAsset ? [localAsset] : []),
      ...remoteAssets,
      FALLBACK_SRC,
    ]),
  ];
  return (
    <TokenImage
      key={`${chainId}:${address}`}
      {...props}
      imagesSrc={imagesSrc}
    />
  );
};

function TokenImage({
  imagesSrc,
  className,
  width,
  height,
  quality,
  alt,
}: ImageFallbackProps & { imagesSrc: string[] }) {
  const [index, setIndex] = useState(0);

  return (
    <Image
      className={className}
      width={Number(width)}
      height={Number(height)}
      quality={quality}
      alt={alt || ""}
      src={imagesSrc[index] || FALLBACK_SRC}
      onError={() => {
        if (index < imagesSrc.length - 1) {
          setIndex((current) => current + 1);
        }
      }}
      unoptimized // Disabling to avoid 404 error log on the console
    />
  );
}
