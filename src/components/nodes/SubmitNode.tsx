import { Button, useToast } from "@bleu-fi/ui";
import { EnterIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Address } from "viem";

import { FALLBACK_STATES, useFallbackState } from "#/hooks/useFallbackState";
import { useRawTxData } from "#/hooks/useRawTxData";
import { useRecipeData } from "#/hooks/useRecipeData";
import { createRawTxArgs } from "#/lib/transactionFactory";
import { IStopLossRecipeData } from "#/lib/types";

import { Dialog } from "../Dialog";
import { Handle } from "../Handle";

export function SubmitNode() {
  const {
    safe: { safeAddress },
  } = useSafeAppsSDK();
  const { push } = useRouter();
  const { sendTransactions } = useRawTxData();
  const { toast } = useToast();
  const { fallbackState, domainSeparator } = useFallbackState();
  const { ordersData } = useRecipeData();
  const needFallbackSetting =
    fallbackState === FALLBACK_STATES.HAS_NOTHING ||
    fallbackState === FALLBACK_STATES.HAS_EXTENSIBLE_FALLBACK;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = async () => {
    if (!ordersData || !domainSeparator) {
      return;
    }
    setIsSubmitting(true);
    const rawArgs = ordersData
      .map((order) =>
        createRawTxArgs({
          data: order,
          safeAddress: safeAddress as Address,
          domainSeparator,
          fallbackState: fallbackState as FALLBACK_STATES,
        })
      )
      .flat();

    sendTransactions(rawArgs)
      .then(() => {
        setIsSubmitting(false);
        push("/history");
      })
      .catch(() => {
        setIsSubmitting(false);
        toast({
          title: "Error creating transaction",
          content: "Review your orders and try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <>
      {needFallbackSetting ? (
        <Dialog
          content={
            <div className="flex flex-col gap-3 text-background">
              <p className="text-justify">
                To create the order you need to set the Composable CoW as the
                domain verifier and the Extensible Fallback as the fallback
                handler. You can find more information about it{" "}
                <a
                  href={
                    "https://blog.cow.fi/all-you-need-to-know-about-cow-swaps-new-safe-fallback-handler-8ef0439925d1"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber9 hover:text-amber11"
                >
                  here
                </a>
                .
              </p>
              <Button onClick={createOrder} type="submit">
                I am aware and want to continue
              </Button>
            </div>
          }
        >
          <SubmitButton ordersData={ordersData} isSubmitting={isSubmitting} />
        </Dialog>
      ) : (
        <SubmitButton
          ordersData={ordersData}
          isSubmitting={isSubmitting}
          onClick={createOrder}
        />
      )}
      <Handle type="target" />
    </>
  );
}

export function SubmitButton({
  ordersData,
  isSubmitting,
  onClick,
}: {
  ordersData?: IStopLossRecipeData[];
  isSubmitting: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="submit"
      className="w-64"
      disabled={
        !ordersData ||
        !ordersData.length ||
        ordersData.some((orderData) => orderData.error) ||
        isSubmitting
      }
      onClick={onClick}
    >
      <div className="flex flex-row justify-center text-center items-center gap-4">
        <EnterIcon />
        <p>{isSubmitting ? "Creating Tx..." : "Submit Orders"}</p>
      </div>
    </Button>
  );
}
