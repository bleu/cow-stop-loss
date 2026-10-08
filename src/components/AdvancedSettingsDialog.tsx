"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Separator,
} from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-dropdown-menu";
import { ArrowTopRightIcon, GearIcon, ResetIcon } from "@radix-ui/react-icons";
import cn from "clsx";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  defaultAdvancedSettings,
  haveSettingsChanged,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { useSafeApp } from "#/hooks/useSafeApp";
import { ChainId } from "#/lib/publicClients";
import { generateAdvancedSettingsSchema } from "#/lib/schema";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { AdvancedSwapSettings } from "#/lib/types";

import { BlockExplorerLink } from "./ExplorerLink";
import { Checkbox } from "./ui/checkbox";
import { Form } from "./ui/form";
import { Input } from "./ui/input";

export function AdvancedSettingsDialog() {
  const [open, setOpen] = React.useState(false);
  const { chainId } = useSafeApp();
  const [advancedSettings, setAdvancedSettings] = useAdvancedSettingsStore(
    (state) => [state.advancedSettings, state.setAdvancedSettings],
  );

  const form = useForm<AdvancedSwapSettings>({
    resolver: zodResolver(generateAdvancedSettingsSchema(chainId as ChainId)),
    defaultValues: advancedSettings,
  });

  const {
    reset,
    control,
    formState: { isSubmitting },
  } = form;

  const currentValues = useWatch({ control });
  const areSettingsDifferentFromDefault = haveSettingsChanged(
    currentValues,
    defaultAdvancedSettings,
  );

  const receiver = useWatch({ control, name: "receiver" });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset(advancedSettings);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className={cn(areSettingsDifferentFromDefault && "text-primary")}
        >
          <GearIcon className="size-6" />
        </button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay
          id="dialog-overlay"
          className={cn(
            "bg-black/20 data-[state=open]:animate-overlayShow fixed inset-0 rounded-lg",
          )}
        />
        <DialogContent
          className={cn(
            "data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-lg focus:outline-none bg-muted  w-[90vw] max-w-[450px] p-[25px] text-foreground",
          )}
        >
          <div className="flex flex-col justify-between w-full">
            <DialogTitle className="text-2xl font-medium ">
              Advanced Settings
            </DialogTitle>
          </div>
          <Form
            {...form}
            className="mt-2 w-full flex flex-col gap-2"
            onSubmit={(data) => {
              setAdvancedSettings(data);
              setOpen(false);
            }}
          >
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
                  networkId={chainId as ChainId}
                />
              }
            />
            <Separator className="bg-white mt-2" />
            <div className="flex flex-col gap-2">
              <Label className="block text-sm font-semibold">Oracle</Label>
              <Input
                name="maxHoursSinceOracleUpdates"
                label="Maximum hours since last oracle update"
                type="number"
                tooltipText={
                  TOOLTIP_DESCRIPTIONS.MAX_TIME_SINCE_LAST_ORACLE_UPDATE
                }
                min={0}
                max={24 * 365}
              />
            </div>
            <Separator className="bg-white my-2" />
            <div className="flex flex-col gap-2">
              <Label className="block text-sm font-semibold">
                Partial executions
              </Label>
              <Checkbox
                name="partiallyFillable"
                label="Enable partially fillable orders"
                tooltipText={TOOLTIP_DESCRIPTIONS.TYPE}
              />
            </div>
            <Button
              className="w-full mt-4"
              type="submit"
              loading={isSubmitting}
              loadingText="Saving..."
            >
              Save Settings
            </Button>
            {areSettingsDifferentFromDefault && (
              <Button
                variant="link"
                type="button"
                className="text-xs flex gap-1 text-white items-center pb-0 h-min"
                onClick={() => {
                  reset(defaultAdvancedSettings);
                  setAdvancedSettings(defaultAdvancedSettings);
                }}
              >
                <ResetIcon className="size-3" /> Reset to default settings
              </Button>
            )}
          </Form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
