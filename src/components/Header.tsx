"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import Image from "next/image";
import Link from "next/link";

import { NetworkChainId, truncateAddress } from "#/utils";

interface IHeader {
  linkUrl: string;
  imageSrc?: string;
  onLinkClick?: () => void;
}

export function Header({ linkUrl, imageSrc, onLinkClick }: IHeader) {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();

  const networkAcronym: {
    [key: string]: string;
  } = {
    [NetworkChainId.ETHEREUM]: "eth",
    [NetworkChainId.GNOSIS]: "gn",
    [NetworkChainId.SEPOLIA]: "sep",
  };

  return (
    <div className="flex h-20 w-full items-center bg-background p-4 text-foreground">
      <div className="mr-auto flex justify-start">
        <Link
          href={linkUrl}
          onClick={onLinkClick}
          className="flex items-center gap-3 justify-self-start"
        >
          <>
            {imageSrc && (
              <Image src={imageSrc} height={50} width={200} alt="" />
            )}
          </>
        </Link>
      </div>
      <div className="flex gap-x-4">
        <div className="ml-auto flex justify-end">
          <div className="border-foreground text-center text-sm rounded-none font-semibold border py-3 px-5">
            {`${networkAcronym[chainId]}:${truncateAddress(safeAddress)}`}
          </div>
        </div>
      </div>
    </div>
  );
}
