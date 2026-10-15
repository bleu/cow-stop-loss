"use client";

import { Button } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ArrowTopRightIcon,
  GearIcon,
  ResetIcon,
} from "@radix-ui/react-icons";
import * as React from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useAccount } from "wagmi";

import {
  defaultAdvancedSettings,
  haveSettingsChanged,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { slippagePercentSchema } from "#/lib/calculateAmounts";
import { ChainId } from "#/lib/publicClients";
import { generateAdvancedSettingsSchema } from "#/lib/schema";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { AdvancedSwapSettings } from "#/lib/types";

import { BlockExplorerLink } from "./ExplorerLink";
import { SlippageInputCard } from "./SlippageInputCard";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { InfoTooltip } from "./ui/tooltip";

type AdvancedSettingsDraft = AdvancedSwapSettings & { slippagePercent: string };

interface AdvancedSettingsPanelProps {
  slippagePercent: string;
  onApplySlippage: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
}

export function AdvancedSettingsPanel({
  slippagePercent,
  onApplySlippage,
  open,
  onOpenChange,
  title,
}: AdvancedSettingsPanelProps) {
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const { address, chainId: accountChainId } = useAccount();
  const chainId = (accountChainId ?? 1) as ChainId;
  const accountScope = `${address?.toLowerCase() ?? "disconnected"}:${chainId}`;
  const previousScope = React.useRef(accountScope);
  const [advancedSettings, setAdvancedSettings] = useAdvancedSettingsStore(
    (state) => [state.advancedSettings, state.setAdvancedSettings],
  );

  const form = useForm<AdvancedSettingsDraft>({
    mode: "onChange",
    resolver: zodResolver(
      generateAdvancedSettingsSchema(chainId).extend({
        slippagePercent: slippagePercentSchema,
      }),
    ),
    defaultValues: { ...advancedSettings, slippagePercent },
  });

  const {
    reset,
    control,
    formState: { isSubmitting },
  } = form;

  React.useEffect(() => {
    if (previousScope.current === accountScope) return;
    previousScope.current = accountScope;
    reset({ ...advancedSettings, slippagePercent });
    onOpenChange(false);
  }, [accountScope, advancedSettings, onOpenChange, reset, slippagePercent]);

  const areSavedSettingsDifferentFromDefault =
    haveSettingsChanged(advancedSettings, defaultAdvancedSettings) ||
    Number(slippagePercent) !== 0.1;

  const receiver = useWatch({ control, name: "receiver" });

  React.useEffect(() => {
    if (!open) return;
    let validationSequence = 0;
    const subscription = form.watch(() => {
      const currentSequence = ++validationSequence;
      void form.trigger().then((valid) => {
        if (!valid || currentSequence !== validationSequence) return;
        if (!mounted.current) return;
        const { slippagePercent: savedSlippage, ...settings } =
          form.getValues();
        setAdvancedSettings(settings);
        onApplySlippage(savedSlippage);
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onApplySlippage, open, setAdvancedSettings]);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        {open ? (
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-primary">
              Settings
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Order settings
            </h1>
            <p className="mt-1 max-w-md text-[15px] leading-5 text-muted-foreground">
              Set price limits and where you receive tokens.
            </p>
          </div>
        ) : (
          title
        )}
        <button
          type="button"
          onClick={() => {
            if (open) {
              onOpenChange(false);
            } else {
              reset({ ...advancedSettings, slippagePercent });
              onOpenChange(true);
            }
          }}
          className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/35 transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${areSavedSettingsDifferentFromDefault ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          aria-label="Order settings"
          aria-expanded={open}
          aria-controls="order-settings-panel"
          title={open ? "Back to order" : "Order settings"}
        >
          {open ? (
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
          ) : (
            <GearIcon aria-hidden="true" className="size-4" />
          )}
          {areSavedSettingsDifferentFromDefault && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 size-2 rounded-full bg-secondary"
            />
          )}
        </button>
      </div>
      {open && (
        <section
          id="order-settings-panel"
          aria-label="Order settings"
          className="mt-5"
          onKeyDown={(event) => {
            if (event.key === "Escape") onOpenChange(false);
          }}
        >
          <FormProvider {...form}>
            <div
              role="group"
              aria-label="Advanced order settings"
              className="grid w-full gap-5"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  event.target instanceof HTMLInputElement
                ) {
                  event.preventDefault();
                  void form.handleSubmit(() => onOpenChange(false))();
                }
              }}
            >
              <fieldset className="grid gap-4 border-b border-border/60 pb-5 sm:grid-cols-2">
                <legend className="mb-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:col-span-2">
                  Price protection
                </legend>
                <SlippageInputCard />
                <Input
                  name="maxHoursSinceOracleUpdates"
                  label="Maximum oracle age (hours)"
                  type="number"
                  step="any"
                  tooltipText={
                    TOOLTIP_DESCRIPTIONS.MAX_TIME_SINCE_LAST_ORACLE_UPDATE
                  }
                  min={0}
                  max={24 * 365}
                  className="h-11 rounded-xl"
                />
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="mb-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:col-span-2">
                  Order handling
                </legend>
                <Input
                  name="receiver"
                  label="Receiver"
                  placeholder="0xabc...123"
                  tooltipText={TOOLTIP_DESCRIPTIONS.RECEIVER}
                  extraLabelElement={
                    <BlockExplorerLink
                      type="address"
                      label={<ArrowTopRightIcon />}
                      identifier={receiver}
                      networkId={chainId}
                    />
                  }
                  className="h-11 rounded-xl"
                />
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="execution-mode"
                      className="text-sm font-medium leading-none"
                    >
                      Execution
                    </label>
                    <InfoTooltip text={TOOLTIP_DESCRIPTIONS.TYPE} />
                  </div>
                  <Controller
                    control={control}
                    name="partiallyFillable"
                    render={({ field }) => (
                      <Select
                        value={field.value ? "partial" : "fill-or-kill"}
                        onValueChange={(value) =>
                          field.onChange(value === "partial")
                        }
                      >
                        <SelectTrigger
                          id="execution-mode"
                          className="h-11 rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="partial">
                            Allow partial executions
                          </SelectItem>
                          <SelectItem value="fill-or-kill">
                            Fill or kill execution only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </fieldset>
              <div className="grid w-full gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  aria-label="Reset to default settings"
                  className="h-9 w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    reset({
                      ...defaultAdvancedSettings,
                      slippagePercent: "0.1",
                    });
                    setAdvancedSettings(defaultAdvancedSettings);
                    onApplySlippage("0.1");
                  }}
                >
                  <ResetIcon className="mr-1.5 size-3.5" /> Reset to defaults
                </Button>
                <Button
                  className="h-11 w-full rounded-xl text-sm"
                  type="button"
                  aria-label="Return to order"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={() =>
                    void form.handleSubmit(() => onOpenChange(false))()
                  }
                >
                  Return to order
                </Button>
              </div>
            </div>
          </FormProvider>
        </section>
      )}
    </div>
  );
}
