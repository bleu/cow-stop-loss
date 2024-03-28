"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { TransactionStatus } from "@safe-global/safe-apps-sdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "#/components/Spinner";

export default function Page({
  params: { safeTxHash },
}: {
  params: { safeTxHash: string };
}) {
  const { sdk } = useSafeAppsSDK();
  const router = useRouter();

  async function redirectToHistoryOnTxExecuted() {
    const tx = await sdk.txs.getBySafeTxHash(safeTxHash);
    if (tx.txStatus === TransactionStatus.SUCCESS) {
      // Wait 1 second for the subgraph to index the transaction
      setTimeout(() => {
        router.push("/history");
      }, 1000);
    }
  }

  useEffect(() => {
    const intervalId = setInterval(redirectToHistoryOnTxExecuted, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex size-full flex-col items-center px-12 py-16 md:py-20 bg-background">
      <div className="text-center text-3xl text-foreground mb-4">
        The transaction is being processed
      </div>
      <Spinner size="lg" />
    </div>
  );
}
