"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

import { NetworkChainId, truncateAddress } from "#/lib/utils";

interface IHeader {
  linkUrl: string;
  imageSrc?: string;
  children?: ReactNode;
  onLinkClick?: () => void;
}

export function Header({ linkUrl, imageSrc, children, onLinkClick }: IHeader) {
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
    <div className="flex h-20 w-full items-center border-b border-b-blue3 bg-blue2 p-4 text-white">
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
        {children && <div className="flex justify-center">{children}</div>}
        <div className="ml-auto flex justify-end">
          <div className="bg-blue3 text-slate12 border-blue3 rounded-md text-center text-sm font-semibold border focus-visible:outline-blue7 focus-visible:outline-offset-2 disabled:opacity-40 py-3 px-5">
            {`${networkAcronym[chainId]}:${truncateAddress(safeAddress)}`}
          </div>
        </div>
      </div>
    </div>
  );
}
