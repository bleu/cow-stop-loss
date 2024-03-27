import Image from "next/image";
import { useState } from "react";

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

const tokenUrlRoot =
  "https://raw.githubusercontent.com/cowprotocol/token-lists/main/src/public/images";

export const cowprotocolTokenLogoUrl = (
  address?: string,
  chainId?: ChainId
) => {
  if (!address || !chainId) return;
  return `${tokenUrlRoot}/${chainId}/${address.toLowerCase()}/logo.png`;
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
