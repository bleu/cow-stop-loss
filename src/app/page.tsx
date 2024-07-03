"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { redirect } from "next/navigation";

import { Spinner } from "#/components/Spinner";

export default function Page() {
  const { safe } = useSafeAppsSDK();
  if (safe.chainId && safe.safeAddress) {
    redirect(`/${safe.chainId}/${safe.safeAddress}`);
  }
  return <Spinner />;
}
