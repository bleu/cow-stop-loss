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
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import cn from "clsx";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import { useSwapCardContext } from "#/contexts/swapCardContext";
import { ChainId } from "#/lib/publicClients";
import { generateAdvancedSettingsSchema } from "#/lib/schema";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { AdvancedSwapSettings } from "#/lib/types";

import { Checkbox } from "./Checkbox";
import { BlockExplorerLink } from "./ExplorerLink";
import { Input } from "./Input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Form } from "./ui/form";

export function AdvancedSettingsDialog() {
  const [open, setOpen] = React.useState(false);
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();
  const { setAdvancedSettings, advancedSettings } = useSwapCardContext();

  const form = useForm<AdvancedSwapSettings>({
    resolver: zodResolver(generateAdvancedSettingsSchema(chainId as ChainId)),
    defaultValues: advancedSettings,
  });

  const {
    reset,
    control,
    formState: { isSubmitting },
  } = form;

  const receiver = useWatch({ control, name: "receiver" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button>
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
            "data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-lg focus:outline-none bg-foreground  w-[90vw] max-w-[450px] p-[25px]",
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
              tooltipText={TOOLTIP_DESCRIPTIONS.RECIPIENT}
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
              <Accordion
                className="flex flex-col gap-2 text-sm w-full"
                type="single"
                collapsible
              >
                <AccordionItem
                  value="advancedOptions"
                  className="w-full border-none p-0"
                  key="advancedOption"
                >
                  <div className="flex gap-1 items-center">
                    Chainlink is used by default.
                    <AccordionTrigger className="p-1">
                      Edit Oracle
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="p-0">
                    <div className="flex flex-col gap-2 mt-1">
                      <Input
                        name="tokenSellOracle"
                        label="Token sell oracle"
                        placeholder="0xabc...123"
                        tooltipText={TOOLTIP_DESCRIPTIONS.ORACLE_TOKEN_SELL}
                      />
                      <Input
                        name="tokenBuyOracle"
                        label="Token buy oracle"
                        placeholder="0xabc...123"
                        tooltipText={TOOLTIP_DESCRIPTIONS.ORACLE_TOKEN_BUY}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <Input
                  name="maxHoursSinceOracleUpdates"
                  label="Maximum hours since last oracle update"
                  type="number"
                  tooltipText={
                    TOOLTIP_DESCRIPTIONS.MAX_TIME_SINCE_LAST_ORACLE_UPDATE
                  }
                />
              </Accordion>
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
            <Button
              variant="link"
              type="button"
              className="text-xs flex gap-1 text-white items-center "
              onClick={() => {
                const defaultSettings = {
                  receiver: safeAddress,
                  maxHoursSinceOracleUpdates: 1,
                  tokenBuyOracle: "" as const,
                  tokenSellOracle: "" as const,
                  partiallyFillable: false,
                };
                reset(defaultSettings);
                setAdvancedSettings(defaultSettings);
              }}
            >
              <ResetIcon className="size-3" /> Reset to default settings
            </Button>
          </Form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
