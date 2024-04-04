import Image from "next/image";
import { useState } from "react";

import { cowTokenList } from "#/lib/cowTokenList";
import { ChainId } from "#/lib/publicClients";

type ImageAttributes = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

type ImageFallbackProps = Omit<ImageAttributes, "src"> & {
  tokenAddress?: string;
  chainId?: ChainId;
  quality?: number;
};

export const cowprotocolTokenLogoUrl = (
  address?: string,
  chainId?: ChainId
) => {
  if (!address || !chainId) return;
  return cowTokenList.find(
    (token) =>
      token.chainId === chainId &&
      token.address.toLowerCase() === address.toLowerCase()
  )?.logoURI;
};

const FALLBACK_SRC = "/assets/generic-token-logo.png";
export const TokenLogo = ({
  tokenAddress,
  chainId,
  alt,
  width,
  height,
  className,
  quality,
}: ImageFallbackProps) => {
  const [imageSrc, setImageSrc] = useState<string>(
    cowprotocolTokenLogoUrl(tokenAddress, chainId) || FALLBACK_SRC
  );

  return (
    <Image
      className={className}
      width={Number(width)}
      height={Number(height)}
      quality={quality}
      alt={alt || ""}
      src={imageSrc || FALLBACK_SRC}
      onError={() => {
        setImageSrc(FALLBACK_SRC);
      }}
    />
  );
};
