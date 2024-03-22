import { useToast } from "@bleu-fi/ui";
import { EnterIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Address } from "viem";

import { FALLBACK_STATES, useFallbackState } from "#/hooks/useFallbackState";
import { useRawTxData } from "#/hooks/useRawTxData";
import { useRecipeData } from "#/hooks/useRecipeData";
import { createRawTxArgs } from "#/lib/transactionFactory";

import Button from "../Button";
import { Dialog } from "../Dialog";

export function SubmitNode() {
  const {
    safe: { safeAddress },
  } = useSafeAppsSDK();
  const { push } = useRouter();
  const { sendTransactions } = useRawTxData();
  const { toast } = useToast();
  const { fallbackState, domainSeparator } = useFallbackState();
  const { ordersData } = useRecipeData();
  const [isOpen, setIsOpen] = useState(false);
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
          description: "Review your orders and try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <>
      <Dialog
        content={
          <div className="flex flex-col gap-3 text-white">
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
        title="Fallback Setting Requirement"
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      />

      <Button
        type={"submit"}
        className="w-64"
        disabled={
          !ordersData ||
          !ordersData.length ||
          ordersData.some((orderData) => orderData.error) ||
          isSubmitting
        }
        onClick={() => {
          if (!needFallbackSetting) {
            createOrder();
            return;
          }
          setIsOpen(true);
        }}
      >
        <div className="flex flex-row justify-center text-center items-center gap-4">
          <EnterIcon />
          <p>{isSubmitting ? "Creating Tx..." : "Submit Orders"}</p>
        </div>
      </Button>
      <Handle
        type="target"
        position={Position.Top}
        className="size-2 rounded-full bg-slate6"
      />
    </>
  );
}
