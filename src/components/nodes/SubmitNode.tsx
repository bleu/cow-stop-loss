import { Button, useToast } from "@bleu-fi/ui";
import { EnterIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Address } from "viem";
import { ZodError } from "zod";

import { useBuilder } from "#/contexts/builder";
import { FALLBACK_STATES, useFallbackState } from "#/hooks/useFallbackState";
import { useRawTxData } from "#/hooks/useRawTxData";
import { ChainId } from "#/lib/publicClients";
import { generateStopLossRecipeSchema } from "#/lib/schema";
import { createRawTxArgs } from "#/lib/transactionFactory";
import { IStopLossRecipeData } from "#/lib/types";

import { Dialog } from "../Dialog";
import { Handle } from "../Handle";

export function SubmitNode() {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();
  const { push } = useRouter();
  const { sendTransactions } = useRawTxData();
  const { toast } = useToast();
  const { fallbackState, domainSeparator } = useFallbackState();
  const { ordersData } = useBuilder();
  const needFallbackSetting =
    fallbackState === FALLBACK_STATES.HAS_NOTHING ||
    fallbackState === FALLBACK_STATES.HAS_EXTENSIBLE_FALLBACK;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stopLossRecipeSchema = generateStopLossRecipeSchema({
    chainId: chainId as ChainId,
  });

  const createOrder = async () => {
    if (!ordersData || !domainSeparator) {
      return;
    }

    for (let i = 0; i < ordersData.length; i++) {
      const stop = await stopLossRecipeSchema
        .parseAsync(ordersData[i])
        .then(() => false)
        .catch((error: ZodError) => {
          toast({
            title: "Error validating parameters",
            description: `${error.issues[0].message} error for order ${i + 1}`,
            variant: "destructive",
          });
          return true;
        });
      if (stop) {
        return;
      }
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

    try {
      const { safeTxHash } = await sendTransactions(rawArgs);
      push(`/txpending/${safeTxHash}`);
    } catch {
      toast({
        title: "Error creating transaction",
        description: "Review your orders and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {needFallbackSetting ? (
        <Dialog
          title="Fallback Settings"
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
                  className="text-accent hover:accent/70"
                >
                  here
                </a>
                .
              </p>
            </div>
          }
          submitText="I am aware and want to continue"
          onSubmit={createOrder}
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
