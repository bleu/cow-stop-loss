"use client";

import Image from "next/image";
import { useState } from "react";
import { Address, getAddress } from "viem";
import { arbitrum, gnosis, mainnet, sepolia } from "viem/chains";

import { ChainId } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";

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
  [mainnet.id]: "ethereum",
  [gnosis.id]: "xdai",
  [sepolia.id]: "ethereum",
  [arbitrum.id]: "arbitrum",
};

export function trustTokenLogoUrl(address?: string, chainId?: ChainId): string {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainIdToName[chainId || 1]}/assets/${address}/logo.png`;
}

const FALLBACK_SRC = "/assets/generic-token-logo.png";

function supportedTokenAsset(tokenAddress?: string, chainId?: ChainId) {
  if (!tokenAddress || !chainId) return FALLBACK_SRC;
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  const token = [...sellTokens.map(({ token }) => token), buyToken.token].find(
    ({ address }) => address.toLowerCase() === tokenAddress.toLowerCase(),
  );
  if (!token) return FALLBACK_SRC;
  if (token.symbol === "WETH") return "/assets/tokens/weth.svg";
  if (token.symbol === "WBTC") return "/assets/tokens/wbtc.svg";
  if (token.symbol.startsWith("USDC")) return "/assets/tokens/usdc.svg";
  return FALLBACK_SRC;
}

export const TokenLogo = ({
  tokenAddress,
  chainId,
  alt,
  width,
  height,
  className,
  quality,
}: ImageFallbackProps) => {
  const localAsset = supportedTokenAsset(tokenAddress, chainId);
  const remoteAssets = [
    cowprotocolTokenLogoUrl(tokenAddress?.toLowerCase(), chainId),
    cowprotocolTokenLogoUrl(getAddress(tokenAddress as Address), chainId),
    cowprotocolTokenLogoUrl(tokenAddress?.toLowerCase(), 1),
    cowprotocolTokenLogoUrl(getAddress(tokenAddress as Address), 1),
    trustTokenLogoUrl(tokenAddress, chainId),
    trustTokenLogoUrl(tokenAddress?.toLowerCase(), chainId),
    trustTokenLogoUrl(getAddress(tokenAddress as Address), chainId),
    trustTokenLogoUrl(tokenAddress?.toLowerCase(), 1),
    trustTokenLogoUrl(getAddress(tokenAddress as Address), 1),
  ];
  const imagesSrc =
    localAsset === FALLBACK_SRC
      ? [...remoteAssets, FALLBACK_SRC]
      : [localAsset];
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
          setIndex(index + 1);
        }
      }}
      unoptimized // Disabling to avoid 404 error log on the console
    />
  );
};
