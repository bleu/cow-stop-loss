"use client";

import { Button, Card, CardContent, CardTitle } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useSwapContext } from "#/contexts/swapContext";
import { ChainId } from "#/lib/publicClients";
import { generateSwapSchema } from "#/lib/schema";
import { DraftOrder, SwapData } from "#/lib/types";

import { AdvancedSettingsAlert } from "./AdvancedSettingsAlert";
import { AdvancedSettingsDialog } from "./AdvancedSettingsDialog";
import { InvertTokensSeparator } from "./InvertTokensSeparator";
import { OrderTypeSwitch } from "./OrderTypeSwitch";
import { PriceInputCard } from "./PriceInputCard";
import { ReviewOrdersDialog } from "./ReviewOrdersDialog";
import { TokenInputCard } from "./TokenInputCard";
import { Form } from "./ui/form";

export function SwapCard() {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const formSchema = generateSwapSchema(chainId as ChainId);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [draftOrder, setDraftOrder] = useState<DraftOrder[]>([]);
  const { createDraftOrder, draftOrders } = useSwapContext();
  const form = useForm<SwapData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isSellOrder: true,
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  return (
    <Form
      {...form}
      onSubmit={async (data) => {
        const newOrder = await createDraftOrder(data);
        setDraftOrder([newOrder]);
        setReviewDialogOpen(true);
      }}
      className="w-full"
    >
      <ReviewOrdersDialog
        setOpen={setReviewDialogOpen}
        open={reviewDialogOpen}
        draftOrders={draftOrder}
        showAddOrders
      />
      <Card className="bg-foreground text-background w-full p-5 rounded-md overflow-auto">
        <CardTitle className="w-full flex justify-between">
          <OrderTypeSwitch />
          <AdvancedSettingsDialog />
        </CardTitle>
        <CardContent className="flex flex-col gap-4 py-5 px-0">
          <TokenInputCard side="Sell" />
          <div className="flex gap-2 justify-between">
            <PriceInputCard fieldName="strikePrice" showMarketPrice />
            <PriceInputCard fieldName="limitPrice" />
          </div>
          <InvertTokensSeparator />
          <TokenInputCard side="Buy" />
          <AdvancedSettingsAlert />
          <Button
            className="rounded-md"
            type="submit"
            loading={isSubmitting}
            loadingText="Validating..."
            disabled={draftOrders.length > 4}
          >
            {draftOrders.length > 4
              ? "You can only have 5 draft orders at a time"
              : "Review stop-loss order"}
          </Button>
        </CardContent>
      </Card>
    </Form>
  );
}
