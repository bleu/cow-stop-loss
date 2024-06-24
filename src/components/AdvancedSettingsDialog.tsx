"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Form,
  Separator,
} from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-dropdown-menu";
import { GearIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import cn from "clsx";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { advancedSettingsSchema } from "#/lib/schema";

import { Input } from "./Input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function AdvancedSettingsDialog() {
  const [open, setOpen] = React.useState(false);
  const {
    safe: { safeAddress },
  } = useSafeAppsSDK();
  const form = useForm<z.input<typeof advancedSettingsSchema>>({
    resolver: zodResolver(advancedSettingsSchema),
    defaultValues: {
      receiver: safeAddress,
      maxHoursSinceOracleUpdates: 1,
    },
  });

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
            "bg-black/20 data-[state=open]:animate-overlayShow fixed inset-0 rounded-none"
          )}
        />
        <DialogContent
          className={cn(
            "data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-none focus:outline-none bg-foreground text-background w-[90vw] max-w-[450px] p-[25px]"
          )}
        >
          <div className="flex flex-col justify-between w-full">
            <DialogTitle className="text-2xl font-medium text-background">
              Advanced Settings
            </DialogTitle>
          </div>
          <Form {...form} className="mt-2 w-full flex flex-col gap-2">
            <Input name="receiver" label="Receiver" />
            <Separator className="mt-2" />
            <div className="flex flex-col gap-1">
              <Label className="block text-sm text-background font-semibold">
                Oracle
              </Label>
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
                    <div className="flex flex-col gap-2">
                      <Input name="tokenSellOracle" label="Token Sell Oracle" />
                      <Input name="tokenBuyOracle" label="Token Buy Oracle" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <Input
                  name="maxHoursSinceOracleUpdates"
                  label="Maximum Hours Since Last Oracle Update"
                />
              </Accordion>
              <Separator className="mt-2" />
              <Button
                className="w-full mt-4"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Save Settings
              </Button>
            </div>
          </Form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
