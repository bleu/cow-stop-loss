"use client";

import { Card, CardContent } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Address } from "viem";
import { useAccount } from "wagmi";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { useDraftOrder } from "#/hooks/useDraftOrder";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { ChainId } from "#/lib/publicClients";
import { generateSwapSchema } from "#/lib/schema";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { DraftOrder, SwapData } from "#/lib/types";

import { AdvancedSettingsAlert } from "../AdvancedSettingsAlert";
import { AdvancedSettingsDialog } from "../AdvancedSettingsDialog";
import { PriceInputCard } from "../PriceInputCard";
import { TokenInputCard } from "../TokenInputCard";
import { Form } from "../ui/form";
import { SwapCardSubmitButton } from "./SwapCardSubmitButton";
import { ValidToInput } from "./ValidToInput";

export interface SwapFormProps {
  reviewDisabled?: boolean;
  onReviewOrder: (
    draft: DraftOrder,
    chainId: ChainId,
    account: Address,
  ) => void;
}

export function SwapForm(props: SwapFormProps) {
  const { address, chainId } = useAccount();
  return (
    <WalletSwapForm key={`${address?.toLowerCase()}:${chainId}`} {...props} />
  );
}

function WalletSwapForm({
  onReviewOrder,
  reviewDisabled = false,
}: SwapFormProps) {
  const { chainId: accountChainId, address: walletAddress } = useAccount();
  const chainId = accountChainId as ChainId;

  const [setCurrentDraftOrder, createDraftOrder] = useDraftOrder((state) => [
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
  const [tokenSell, tokenBuy, amountSell, strikePrice, slippagePercent] =
    useWatch({
      control: form.control,
      name: [
        "tokenSell",
        "tokenBuy",
        "amountSell",
        "strikePrice",
        "slippagePercent",
      ],
    });
  React.useEffect(() => {
    let derivedAmount = "";
    if (tokenSell && tokenBuy) {
      try {
        derivedAmount = calculateAmounts({
          isSellOrder: true,
          amount: amountSell,
          strikePrice,
          slippagePercent,
          sellDecimals: tokenSell.decimals,
          buyDecimals: tokenBuy.decimals,
        }).amountBuy;
      } catch {
        derivedAmount = "";
      }
    }
    if (getValues("amountBuy") !== derivedAmount) {
      setValue("amountBuy", derivedAmount, { shouldValidate: true });
    }
  }, [
    amountSell,
    strikePrice,
    slippagePercent,
    tokenSell,
    tokenBuy,
    getValues,
    setValue,
  ]);
  const submissionId = React.useRef(0);

  React.useEffect(
    () => () => {
      useAdvancedSettingsStore
        .getState()
        .setAdvancedSettings(defaultAdvancedSettings);
    },
    [chainId, walletAddress],
  );

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
  }, [chainId, walletAddress, reset]);

  React.useEffect(() => {
    submissionId.current += 1;
    setCurrentDraftOrder(undefined);
    clearErrors("root");
    return () => {
      submissionId.current += 1;
    };
  }, [
    chainId,
    walletAddress,
    tokenSell?.address,
    tokenBuy?.address,
    setCurrentDraftOrder,
    clearErrors,
  ]);

  return (
    <Form
      {...form}
      onSubmit={async (data) => {
        if (reviewDisabled) return;
        const requestId = ++submissionId.current;
        clearErrors("root");
        try {
          if (!walletAddress)
            throw new Error("Connect a wallet to prepare an order.");
          if (!data.isSellOrder)
            throw new Error("Only exact-sell orders are supported.");
          const newOrder = await createDraftOrder(data, chainId, walletAddress);
          if (requestId !== submissionId.current) return;
          setCurrentDraftOrder(newOrder);
          onReviewOrder(newOrder, chainId, walletAddress);
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
      <fieldset
        disabled={form.formState.isSubmitting}
        className="w-full min-w-0"
      >
        <Card className="bg-muted w-full p-4 rounded-lg">
          <CardContent className="flex flex-col gap-2 p-0">
            <div className="w-full flex justify-between pb-4">
              <AdvancedSettingsDialog
                slippagePercent={slippagePercent}
                onApplySlippage={(value) =>
                  setValue("slippagePercent", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </div>
            <TokenInputCard side="Sell" />
            <div className="grid gap-2 sm:grid-cols-2">
              <PriceInputCard />
              <ValidToInput />
            </div>
            <TokenInputCard side="Buy" />
            <AdvancedSettingsAlert />
            {form.formState.errors.root?.message && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <SwapCardSubmitButton disabled={reviewDisabled} />
          </CardContent>
        </Card>
      </fieldset>
    </Form>
  );
}
