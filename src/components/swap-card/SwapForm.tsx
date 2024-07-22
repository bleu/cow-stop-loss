"use client";

import { Card, CardContent } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import React from "react";
import { useForm } from "react-hook-form";

import { useDraftOrder } from "#/hooks/useDraftOrder";
import { useSafeApp } from "#/hooks/useSafeApp";
import { swapSchema } from "#/lib/schema";
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
import { ValidToInput } from "./ValidToInput";

export function SwapForm() {
  const { chainId, safeAddress } = useSafeApp();

  const [currentDraftOrder, setCurrentDraftOrder, createDraftOrder] =
    useDraftOrder((state) => [
      state.currentDraftOrder,
      state.setCurrentDraftOrder,
      state.createDraftOrder,
    ]);

  const form = useForm<SwapData>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      isSellOrder: true,
    },
  });

  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);

  return (
    <Form
      {...form}
      onSubmit={async (data) => {
        const newOrder = await createDraftOrder(data, chainId, safeAddress);
        setCurrentDraftOrder(newOrder);
        setReviewDialogOpen(true);
      }}
      className="w-full"
    >
      <ReviewOrdersDialog
        open={reviewDialogOpen}
        setOpen={setReviewDialogOpen}
        draftOrders={currentDraftOrder ? [currentDraftOrder] : []}
        showAddOrders
      />
      <Card className="bg-muted w-full p-4 rounded-lg">
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
          <ValidToInput />
          <InvertTokensSeparator />
          <TokenInputCard side="Buy" />
          <AdvancedSettingsAlert />
          <SwapCardSubmitButton />
        </CardContent>
      </Card>
    </Form>
  );
}
