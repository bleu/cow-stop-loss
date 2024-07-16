"use client";

import { Card, CardContent } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import React from "react";
import { useForm } from "react-hook-form";

import { useDraftOrder } from "#/hooks/useDraftOrder";
import { useSafeApp } from "#/hooks/useSafeApp";
import { useUIStore } from "#/hooks/useUIState";
import { ChainId } from "#/lib/publicClients";
import { generateSwapSchema } from "#/lib/schema";
import { SwapData } from "#/lib/types";

import { AdvancedSettingsAlert } from "../AdvancedSettingsAlert";
import { AdvancedSettingsDialog } from "../AdvancedSettingsDialog";
import { CurrentMarketPrice } from "../CurrentMarketPrice";
import { InvertTokensSeparator } from "../InvertTokensSeparator";
import { OrderTypeSwitch } from "../OrderTypeSwitch";
import { PriceInputCard } from "../PriceInputCard";
import { ReviewOrdersDialog } from "../ReviewOrdersDialog";
import { TokenInputCard } from "../TokenInputCard";
import { Form } from "../ui/form";
import { SwapCardSubmitButton } from "./SwapCardSubmitButton";

export function SwapForm() {
  const { chainId } = useSafeApp();

  const formSchema = React.useMemo(
    () => generateSwapSchema(chainId as ChainId),
    [chainId],
  );

  const [currentDraftOrder, setCurrentDraftOrder, createDraftOrder] =
    useDraftOrder((state) => [
      state.currentDraftOrder,
      state.setCurrentDraftOrder,
      state.createDraftOrder,
    ]);
  const [setReviewDialogOpen] = useUIStore((state) => [
    state.setReviewDialogOpen,
  ]);

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
        const newOrder = await createDraftOrder(data, chainId);
        setCurrentDraftOrder(newOrder);
        setReviewDialogOpen(true);
      }}
      className="w-full"
    >
      <ReviewOrdersDialog
        draftOrders={currentDraftOrder ? [currentDraftOrder] : []}
        showAddOrders
      />
      <Card className="bg-foreground w-full p-5 rounded-lg overflow-y-scroll scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-primary scrollbar-track-background scrollbar-w-4">
        <CardContent className="flex flex-col gap-2 p-0">
          <div className="w-full flex justify-between pb-4">
            <OrderTypeSwitch />
            <AdvancedSettingsDialog />
          </div>
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
