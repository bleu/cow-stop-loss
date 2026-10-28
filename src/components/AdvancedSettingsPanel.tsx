"use client";

import { Button } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useAccount } from "wagmi";

import { PixelIcon } from "#/components/ui/pixel-icon";
import {
  advancedSettingsForRoute,
  defaultAdvancedSettings,
  haveSettingsChanged,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import {
  configuredChainMaxAgeSeconds,
  configuredRouteMaxAgeSeconds,
} from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { generateAdvancedSettingsSchema } from "#/lib/schema";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { AdvancedSwapSettings, IToken } from "#/lib/types";

import { BlockExplorerLink } from "./ExplorerLink";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { InfoTooltip } from "./ui/tooltip";

interface AdvancedSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  orderTiming?: React.ReactNode;
  tokenPair?: { tokenSell: IToken; tokenBuy: IToken };
}

export function AdvancedSettingsPanel({
  open,
  onOpenChange,
  title,
  orderTiming,
  tokenPair,
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
  const [
    savedSettings,
    oracleAgeMode,
    setAdvancedSettings,
    resetAdvancedSettings,
  ] = useAdvancedSettingsStore((state) => [
    state.advancedSettings,
    state.oracleAgeMode,
    state.setAdvancedSettings,
    state.resetAdvancedSettings,
  ]);

  const maxAgeSeconds = tokenPair
    ? configuredRouteMaxAgeSeconds({ chainId, ...tokenPair })
    : configuredChainMaxAgeSeconds(chainId);
  const maxOracleHours = maxAgeSeconds / 3600;
  const advancedSettings = advancedSettingsForRoute(
    savedSettings,
    oracleAgeMode,
    maxAgeSeconds,
  );
  const routeDefaults = advancedSettingsForRoute(
    defaultAdvancedSettings,
    "automatic",
    maxAgeSeconds,
  );
  const form = useForm<AdvancedSwapSettings>({
    mode: "onChange",
    resolver: zodResolver(generateAdvancedSettingsSchema(chainId, tokenPair)),
    defaultValues: advancedSettings,
  });

  const {
    reset,
    control,
    formState: { isSubmitting },
  } = form;

  React.useEffect(() => {
    if (previousScope.current === accountScope) return;
    previousScope.current = accountScope;
    reset(advancedSettings);
    onOpenChange(false);
  }, [accountScope, advancedSettings, onOpenChange, reset]);

  const areSavedSettingsDifferentFromDefault = haveSettingsChanged(
    advancedSettings,
    routeDefaults,
  );

  const receiver = useWatch({ control, name: "receiver" });

  React.useEffect(() => {
    if (!open) return;
    let validationSequence = 0;
    let active = true;
    const subscription = form.watch(() => {
      const currentSequence = ++validationSequence;
      void form.trigger().then((valid) => {
        if (!active || !valid || currentSequence !== validationSequence) return;
        if (!mounted.current) return;
        setAdvancedSettings(
          form.getValues(),
          form.getFieldState("maxHoursSinceOracleUpdates").isDirty
            ? "explicit"
            : oracleAgeMode,
        );
      });
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [form, open, oracleAgeMode, setAdvancedSettings]);

  return (
    <div className="rescue-settings w-full">
      <div className="rescue-settings-heading flex min-h-11 items-center justify-between gap-2 lg:min-h-7">
        {open ? (
          <div className="min-w-0">
            <p className="rescue-display-eyebrow font-sans text-[10px] uppercase tracking-[0.18em] text-secondary">
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
              reset(advancedSettings);
              onOpenChange(true);
            }
          }}
          className={`rescue-secondary-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative inline-flex size-11 shrink-0 items-center justify-center p-0 transition-colors lg:size-7 lg:min-h-7 lg:min-w-7 ${areSavedSettingsDifferentFromDefault ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          aria-label="Order settings"
          aria-expanded={open}
          aria-controls="order-settings-panel"
          title={open ? "Back to order" : "Order settings"}
        >
          {open ? (
            <PixelIcon name="arrow-left" className="size-4" />
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
          className="rescue-settings-panel flex flex-col gap-4"
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
              className="rescue-settings-fields flex w-full flex-1 flex-col gap-4"
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
                min={1 / 3600}
                max={maxOracleHours}
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
                        className="pixel-control rescue-square-control min-h-11 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 rounded-none border-border bg-card"
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
                    label={
                      <PixelIcon name="external-link" className="size-4" />
                    }
                    identifier={receiver}
                    networkId={chainId}
                  />
                }
                className="min-h-11 h-11 rounded-none border-border bg-card"
              />
              <div className="rescue-settings-actions mt-auto grid w-full grid-cols-1 gap-3">
                <Button
                  variant="ghost"
                  type="button"
                  aria-label="Reset to default settings"
                  className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 w-full whitespace-normal rounded-none px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    reset(routeDefaults);
                    resetAdvancedSettings();
                    onOpenChange(false);
                  }}
                >
                  <PixelIcon name="reload" className="mr-1.5 size-3.5" /> Reset
                  to defaults
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
