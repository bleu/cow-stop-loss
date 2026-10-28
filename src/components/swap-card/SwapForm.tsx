"use client";

import { Card, CardContent } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { useAccount } from "wagmi";

import { useAdvancedSettingsStore } from "#/hooks/useAdvancedSettings";
import { useDraftOrder } from "#/hooks/useDraftOrder";
import { useOrderQuote } from "#/hooks/useOrderQuote";
import { useOrderSizeLimit } from "#/hooks/useOrderSizeLimit";
import { useSwapTokenBalances } from "#/hooks/useSwapTokenBalances";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { assertOrderSizeLimit } from "#/lib/orderSizeLimit";
import { ChainId } from "#/lib/publicClients";
import { generateSwapSchema, VALID_TO_OPTIONS } from "#/lib/schema";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { DraftOrder, SwapData } from "#/lib/types";

import { AdvancedSettingsAlert } from "../AdvancedSettingsAlert";
import { AdvancedSettingsPanel } from "../AdvancedSettingsPanel";
import { PriceInputCard } from "../PriceInputCard";
import { TokenInputCard } from "../TokenInputCard";
import { Form } from "../ui/form";
import { WarningNotice } from "../ui/warning-notice";
import { SwapCardSubmitButton } from "./SwapCardSubmitButton";
import { ValidToInput } from "./ValidToInput";

export interface SwapFormProps {
  reviewDisabled?: boolean;
  onReviewOrder: (
    draft: DraftOrder,
    chainId: ChainId,
    account: Address,
  ) => void | Promise<void>;
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
  const chainId = (accountChainId ?? 1) as ChainId;
  const { buyToken, unavailableReason } = getSupportedTokens(chainId);

  const [setCurrentDraftOrder, createDraftOrder] = useDraftOrder((state) => [
    state.setCurrentDraftOrder,
    state.createDraftOrder,
  ]);

  const form = useForm<SwapData>({
    resolver: zodResolver(generateSwapSchema(chainId)),
    mode: "onChange",
    defaultValues: {
      isSellOrder: true,
      slippagePercent: "1",
      validTo: VALID_TO_OPTIONS.YEAR,
      amountSell: "",
      amountBuy: "",
      strikePrice: "",
      tokenBuy: buyToken.token,
    },
  });
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  React.useEffect(() => {
    if (!settingsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsOpen]);
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
  const orderSizeLimit = useOrderSizeLimit({
    chainId,
    tokenSell,
    sellAmount: amountSell,
  });
  const [autoSlippage, setAutoSlippage] = React.useState(true);
  const { data: oraclePrice } = useTokenPairPrice(tokenSell, tokenBuy);
  const editing = !reviewDisabled && !form.formState.isSubmitting;
  const quote = useOrderQuote({
    chainId,
    account: walletAddress,
    tokenSell,
    tokenBuy,
    amountSell,
    oraclePrice,
    enabled: editing,
  });
  React.useEffect(() => {
    if (autoSlippage && editing)
      setValue("slippagePercent", quote.slippagePercent, {
        shouldValidate: true,
      });
  }, [autoSlippage, editing, quote.slippagePercent, setValue]);
  const applySlippage = React.useCallback(
    (value: string) => {
      setValue("slippagePercent", value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue],
  );

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
      useAdvancedSettingsStore.getState().resetAdvancedSettings();
    },
    [chainId, walletAddress],
  );

  React.useEffect(() => {
    reset({
      isSellOrder: true,
      slippagePercent: "1",
      validTo: VALID_TO_OPTIONS.YEAR,
      amountSell: "",
      amountBuy: "",
      strikePrice: "",
      tokenBuy: buyToken.token,
    });
    const balances = useSwapTokenBalances.getState();
    balances.setTokenSellBalance(undefined);
    balances.setTokenBuyBalance(undefined);
  }, [chainId, walletAddress, reset, buyToken.token]);

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
        if (
          reviewDisabled ||
          unavailableReason ||
          quote.isLoading ||
          orderSizeLimit !== "allowed"
        )
          return;
        const requestId = ++submissionId.current;
        clearErrors("root");
        try {
          if (!walletAddress)
            throw new Error("Connect a wallet to prepare an order.");
          if (!data.isSellOrder)
            throw new Error("Only exact-sell orders are supported.");
          await assertOrderSizeLimit({
            chainId,
            tokenSell: data.tokenSell,
            sellAmount: parseUnits(data.amountSell, data.tokenSell.decimals),
          });
          if (requestId !== submissionId.current) return;
          const newOrder = await createDraftOrder(data, chainId, walletAddress);
          if (requestId !== submissionId.current) return;
          setCurrentDraftOrder(newOrder);
          await onReviewOrder(newOrder, chainId, walletAddress);
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
      className="rescue-swap-form w-full"
    >
      <fieldset
        disabled={form.formState.isSubmitting}
        className="flex w-full min-w-0 flex-col"
      >
        <Card className="flex w-full min-w-0 flex-col rounded-none border-0 bg-transparent p-0 shadow-none">
          <CardContent className="rescue-swap-content flex flex-col gap-3 p-0">
            <AdvancedSettingsPanel
              slippagePercent={slippagePercent}
              autoSlippage={autoSlippage}
              onAutoSlippageChange={setAutoSlippage}
              tokenPair={
                tokenSell && tokenBuy ? { tokenSell, tokenBuy } : undefined
              }
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              orderTiming={<ValidToInput />}
              title={
                <div className="min-w-0">
                  <p className="rescue-display-eyebrow font-sans text-[10px] uppercase tracking-[0.18em] text-secondary">
                    Define · Your parachute
                  </p>
                  <h2
                    id="place-order-title"
                    className="mt-2 text-balance font-serif text-[28px] leading-tight tracking-tight sm:text-[32px]"
                  >
                    Place a stop-loss order
                  </h2>
                </div>
              }
              onApplySlippage={applySlippage}
            />
            <div
              aria-hidden={settingsOpen}
              ref={(element) => {
                element?.toggleAttribute("inert", settingsOpen);
              }}
              data-inactive={settingsOpen}
              className="rescue-order-fields flex flex-col gap-3"
            >
              {unavailableReason && (
                <p role="alert" className="text-sm text-muted-foreground">
                  {unavailableReason}
                </p>
              )}
              <TokenInputCard side="Sell" />
              <PriceInputCard
                key={`${tokenSell?.address.toLowerCase()}:${tokenBuy?.address.toLowerCase()}`}
              />
              <TokenInputCard side="Buy" />
              {autoSlippage &&
                quote.hasInput &&
                !quote.isLoading &&
                quote.usedFallback && (
                  <WarningNotice>
                    The pair recommendation is unavailable. Auto uses a 1%
                    fallback plus any estimated execution price gap.
                  </WarningNotice>
                )}
              {quote.quoteError && (
                <WarningNotice>
                  {quote.quoteError.message.startsWith("The sell amount")
                    ? quote.quoteError.message
                    : "A current execution quote is unavailable. This order might not execute."}
                </WarningNotice>
              )}
              {autoSlippage && !quote.isLoading && quote.isHigh && (
                <WarningNotice
                  tooltip={
                    quote.isCapped
                      ? "Auto slippage has reached 10%. The current estimate is higher, so the order might not execute. You can adjust slippage in Order settings."
                      : `Auto uses ${quote.slippagePercent}% slippage for this amount. A higher slippage allows a lower execution price. You can adjust slippage in Order settings.`
                  }
                >
                  {quote.isCapped
                    ? "The suggested slippage is above the 10% maximum. This trade might fail."
                    : "Price slippage is above 1%"}
                </WarningNotice>
              )}
              <AdvancedSettingsAlert
                slippagePercent={slippagePercent}
                showSlippageWarning={!autoSlippage}
              />
              {form.formState.errors.root?.message && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <SwapCardSubmitButton
                orderSizeLimit={orderSizeLimit}
                disabled={
                  reviewDisabled ||
                  Boolean(unavailableReason) ||
                  quote.isLoading
                }
              />
            </div>
          </CardContent>
        </Card>
      </fieldset>
    </Form>
  );
}
