"use client";

import { Card, CardContent } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import React from "react";
import { useForm, useWatch } from "react-hook-form";

import { useDraftOrder } from "#/hooks/useDraftOrder";
import { useSafeApp } from "#/hooks/useSafeApp";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { generateSwapSchema } from "#/lib/schema";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { SwapData } from "#/lib/types";

import { AdvancedSettingsAlert } from "../AdvancedSettingsAlert";
import { AdvancedSettingsDialog } from "../AdvancedSettingsDialog";
import { CurrentMarketPrice } from "../CurrentMarketPrice";
import { OrderTypeSwitch } from "../OrderTypeSwitch";
import { PriceInputCard } from "../PriceInputCard";
import { ReviewOrdersDialog } from "../ReviewOrdersDialog";
import { SlippageInputCard } from "../SlippageInputCard";
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
    resolver: zodResolver(generateSwapSchema(chainId)),
    mode: "onChange",
    defaultValues: {
      isSellOrder: true,
      slippagePercent: "0.1",
      amountSell: "",
      amountBuy: "",
      strikePrice: "",
      tokenBuy: getSupportedTokens(chainId).buyToken.token,
    },
  });
  const { reset, clearErrors, setValue, getValues } = form;
  const [
    tokenSell,
    tokenBuy,
    isSellOrder,
    amountSell,
    amountBuy,
    strikePrice,
    slippagePercent,
  ] = useWatch({
    control: form.control,
    name: [
      "tokenSell",
      "tokenBuy",
      "isSellOrder",
      "amountSell",
      "amountBuy",
      "strikePrice",
      "slippagePercent",
    ],
  });
  React.useEffect(() => {
    const derivedField = isSellOrder ? "amountBuy" : "amountSell";
    let derivedAmount = "";
    if (tokenSell && tokenBuy) {
      try {
        const amounts = calculateAmounts({
          isSellOrder,
          amount: isSellOrder ? amountSell : amountBuy,
          strikePrice,
          slippagePercent,
          sellDecimals: tokenSell.decimals,
          buyDecimals: tokenBuy.decimals,
        });
        derivedAmount = amounts[derivedField];
      } catch {
        derivedAmount = "";
      }
    }
    if (getValues(derivedField) !== derivedAmount) {
      setValue(derivedField, derivedAmount, { shouldValidate: true });
    }
  }, [
    isSellOrder,
    amountSell,
    amountBuy,
    strikePrice,
    slippagePercent,
    tokenSell,
    tokenBuy,
    getValues,
    setValue,
  ]);
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const submissionId = React.useRef(0);

  React.useEffect(() => {
    reset({
      isSellOrder: true,
      slippagePercent: "0.1",
      amountSell: "",
      amountBuy: "",
      strikePrice: "",
      tokenBuy: getSupportedTokens(chainId).buyToken.token,
    });
    const balances = useSwapTokenBalances.getState();
    balances.setTokenSellBalance(undefined);
    balances.setTokenBuyBalance(undefined);
  }, [chainId, safeAddress, reset]);

  React.useEffect(() => {
    submissionId.current += 1;
    setCurrentDraftOrder(undefined);
    setReviewDialogOpen(false);
    clearErrors("root");
    return () => {
      submissionId.current += 1;
    };
  }, [
    chainId,
    safeAddress,
    tokenSell?.address,
    tokenBuy?.address,
    setCurrentDraftOrder,
    clearErrors,
  ]);

  return (
    <Form
      {...form}
      onSubmit={async (data) => {
        const requestId = ++submissionId.current;
        clearErrors("root");
        try {
          const newOrder = await createDraftOrder(data, chainId, safeAddress);
          if (requestId !== submissionId.current) return;
          setCurrentDraftOrder(newOrder);
          setReviewDialogOpen(true);
        } catch (error) {
          if (requestId !== submissionId.current) return;
          form.setError("root", {
            type: "manual",
            message:
              error instanceof Error
                ? error.message
                : "Unable to prepare the stop loss order. Please try again.",
          });
        }
      }}
      className="w-full"
    >
      <ReviewOrdersDialog
        open={reviewDialogOpen}
        setOpen={setReviewDialogOpen}
        draftOrders={currentDraftOrder ? [currentDraftOrder] : []}
        showAddOrders
      />
      <fieldset
        disabled={form.formState.isSubmitting}
        className="w-full min-w-0"
      >
        <Card className="bg-muted w-full p-4 rounded-lg">
          <CardContent className="flex flex-col gap-2 p-0">
            <div className="w-full flex justify-between pb-4">
              <OrderTypeSwitch />
              <AdvancedSettingsDialog />
            </div>
            <TokenInputCard side="Sell" />
            <PriceInputCard />
            <SlippageInputCard />
            <CurrentMarketPrice />
            <ValidToInput />
            <TokenInputCard side="Buy" />
            <AdvancedSettingsAlert />
            {form.formState.errors.root?.message && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <SwapCardSubmitButton />
          </CardContent>
        </Card>
      </fieldset>
    </Form>
  );
}
