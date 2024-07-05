"use client";

import { Card, CardContent, CardTitle } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useForm } from "react-hook-form";

import { useSwapCardContext } from "#/contexts/swapCardContext";
import { ChainId } from "#/lib/publicClients";
import { generateSwapSchema } from "#/lib/schema";
import { SwapData } from "#/lib/types";

import { AdvancedSettingsAlert } from "./AdvancedSettingsAlert";
import { AdvancedSettingsDialog } from "./AdvancedSettingsDialog";
import { CurrentMarketPrice } from "./CurrentMarketPrice";
import { InvertTokensSeparator } from "./InvertTokensSeparator";
import { OrderTypeSwitch } from "./OrderTypeSwitch";
import { PriceInputCard } from "./PriceInputCard";
import { ReviewOrdersDialog } from "./ReviewOrdersDialog";
import { SwapCardSubmitButton } from "./SwapCardSubmitButton";
import { TokenInputCard } from "./TokenInputCard";
import { Form } from "./ui/form";

export function SwapForm() {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const formSchema = generateSwapSchema(chainId as ChainId);
  const {
    createDraftOrder,
    currentDraftOrder,
    setCurrentDraftOrder,
    setReviewDialogOpen,
    reviewDialogOpen,
  } = useSwapCardContext();
  const form = useForm<SwapData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isSellOrder: true,
    },
  });

  return (
    <Form
      {...form}
      onSubmit={async (data) => {
        const newOrder = await createDraftOrder(data);
        setCurrentDraftOrder(newOrder);
        setReviewDialogOpen(true);
      }}
      className="w-full"
    >
      <ReviewOrdersDialog
        setOpen={setReviewDialogOpen}
        open={reviewDialogOpen}
        draftOrders={currentDraftOrder ? [currentDraftOrder] : []}
        showAddOrders
      />

      <Card className="bg-foreground w-full p-5 rounded-lg overflow-auto">
        <CardTitle className="w-full flex justify-between">
          <OrderTypeSwitch />
          <AdvancedSettingsDialog />
        </CardTitle>
        <CardContent className="flex flex-col gap-2 py-5 px-0">
          <TokenInputCard side="Sell" />
          <div className="flex gap-2 justify-between">
            <PriceInputCard fieldName="strikePrice" />
            <PriceInputCard fieldName="limitPrice" />
          </div>
          <CurrentMarketPrice />
          <InvertTokensSeparator />
          <TokenInputCard side="Buy" />
          <AdvancedSettingsAlert />
          <SwapCardSubmitButton />
        </CardContent>
      </Card>
    </Form>
  );
}
