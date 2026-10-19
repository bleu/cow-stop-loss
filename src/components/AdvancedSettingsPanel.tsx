"use client";

import { Button } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ArrowTopRightIcon,
  ResetIcon,
} from "@radix-ui/react-icons";
import * as React from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useAccount } from "wagmi";

import { PixelIcon } from "#/components/ui/pixel-icon";
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
  orderTiming?: React.ReactNode;
}

export function AdvancedSettingsPanel({
  slippagePercent,
  onApplySlippage,
  open,
  onOpenChange,
  title,
  orderTiming,
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
    <div className="rescue-settings w-full">
      <div className="rescue-settings-heading flex items-start justify-between gap-3">
        {open ? (
          <div className="min-w-0">
            <p className="rescue-display-eyebrow font-mono text-[10px] uppercase tracking-[0.18em] text-secondary">
              Flight controls
            </p>
            <h2 className="rescue-settings-title mt-2 font-serif text-[28px] leading-tight tracking-tight sm:text-[32px]">
              Order settings
            </h2>
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
          className={`rescue-secondary-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative inline-flex size-11 shrink-0 items-center justify-center transition-colors ${areSavedSettingsDifferentFromDefault ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          aria-label="Order settings"
          aria-expanded={open}
          aria-controls="order-settings-panel"
          title={open ? "Back to order" : "Order settings"}
        >
          {open ? (
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
          ) : (
            <PixelIcon name="settings" className="size-4" />
          )}
          {areSavedSettingsDifferentFromDefault && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 size-2 bg-secondary"
            />
          )}
        </button>
      </div>
      {open && (
        <section
          id="order-settings-panel"
          aria-label="Order settings"
          className="rescue-settings-panel grid gap-3"
          onKeyDown={(event) => {
            if (event.key === "Escape") onOpenChange(false);
          }}
        >
          {orderTiming && (
            <fieldset className="min-w-0">
              <legend className="sr-only">Order timing</legend>
              {orderTiming}
            </fieldset>
          )}
          <FormProvider {...form}>
            <div
              role="group"
              aria-label="Advanced order settings"
              className="rescue-settings-fields grid w-full gap-3"
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
              <SlippageInputCard />
              <Input
                name="maxHoursSinceOracleUpdates"
                layout="inline"
                label={"Maximum oracle age\n(hours)"}
                aria-label="Maximum oracle age (hours)"
                type="number"
                step="any"
                tooltipText={
                  TOOLTIP_DESCRIPTIONS.MAX_TIME_SINCE_LAST_ORACLE_UPDATE
                }
                min={0}
                max={24 * 365}
                className="min-h-11 h-11 rounded-none border-border bg-card"
              />
              <div className="rescue-input-inline min-w-0">
                <div className="rescue-input-label flex items-center gap-1.5">
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
                        className="pixel-control min-h-11 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 rounded-none border-border bg-card"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partial">
                          Allow partial fills
                        </SelectItem>
                        <SelectItem value="fill-or-kill">
                          Fill or kill
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Input
                name="receiver"
                layout="inline"
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
                className="min-h-11 h-11 rounded-none border-border bg-card"
              />
              <div className="rescue-settings-actions grid w-full gap-2 sm:grid-cols-[1fr_1.5fr] sm:items-center">
                <Button
                  variant="ghost"
                  type="button"
                  aria-label="Reset to default settings"
                  className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 w-full rounded-none text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    reset({
                      ...defaultAdvancedSettings,
                      slippagePercent: "0.1",
                    });
                    setAdvancedSettings(defaultAdvancedSettings);
                    onApplySlippage("0.1");
                    onOpenChange(false);
                  }}
                >
                  <ResetIcon className="mr-1.5 size-3.5" /> Reset to defaults
                </Button>
                <Button
                  className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rescue-primary-button h-12 w-full rounded-none text-sm"
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
