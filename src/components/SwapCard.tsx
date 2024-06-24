"use client";

import { Button, Card, CardContent, CardTitle, Form } from "@bleu/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ChainId } from "#/lib/publicClients";
import { generateSwapSchema } from "#/lib/schema";

import { AdvancedSettingsDialog } from "./AdvancedSettingsDialog";
import { InvertTokensSeparator } from "./InvertTokensSeparator";
import { OrderTypeSwitch } from "./OrderTypeSwitch";
import { PriceInputCard } from "./PriceInputCard";
import { TokenInputCard } from "./TokenInputCard";

export function SwapCard() {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const formSchema = generateSwapSchema(chainId as ChainId);
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isSellOrder: true,
    },
  });

  return (
    <Form
      {...form}
      onSubmit={(data) => {
        // eslint-disable-next-line no-console
        console.log(data);
      }}
      className="w-full"
    >
      <Card className="bg-foreground text-background w-full p-5 rounded-none">
        <CardTitle className="w-full flex justify-between">
          <OrderTypeSwitch />
          <AdvancedSettingsDialog />
        </CardTitle>
        <CardContent className="flex flex-col gap-4 py-5 px-0">
          <TokenInputCard side="Sell" />
          <div className="flex gap-2 justify-between">
            <PriceInputCard fieldName="strikePrice" showMarketPrice />
            <PriceInputCard fieldName="limitPrice" />
          </div>
          <InvertTokensSeparator />
          <TokenInputCard side="Buy" />
          <Button className="rounded-none" type="submit">
            Review stop-loss order
          </Button>
        </CardContent>
      </Card>
    </Form>
  );
}
