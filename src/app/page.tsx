"use client";

import { Spinner } from "@bleu/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { redirect } from "next/navigation";

export default function Page() {
  const { safe } = useSafeAppsSDK();
  if (safe.chainId && safe.safeAddress) {
    redirect(`/${safe.chainId}/${safe.safeAddress}`);
  }
  return <Spinner />;
}
