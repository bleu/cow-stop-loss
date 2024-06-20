"use client";

import { Button, Card, CardContent, CardTitle, Form, Switch } from "@bleu/ui";
import { GearIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";

import { InvertTokensSeparator } from "./InvertTokensSeparator";
import { PriceInputCard } from "./PriceInputCard";
import { TokenInputCard } from "./TokenInputCard";

export function SwapCard() {
  const form = useForm();

  return (
    <Form {...form} className="w-full">
      <Card className="bg-foreground text-background w-full p-5 rounded-none">
        <CardTitle className="w-full flex justify-between">
          <div className="flex gap-2 items-center">
            <span className="text-base font-bold">Create a new sell order</span>
            <Switch
              className="shadow-none data-[state=unchecked]:bg-primary"
              defaultChecked={true}
            />
          </div>
          <GearIcon className="size-6" />
        </CardTitle>
        <CardContent className="flex flex-col gap-4 py-5 px-0">
          <TokenInputCard form={form} side="Sell" />
          <div className="flex gap-2 justify-between">
            <PriceInputCard
              title="Strike Price"
              fieldName="price"
              form={form}
              showMarketPrice
            />
            <PriceInputCard
              title="Limit Price"
              fieldName="amount"
              form={form}
            />
          </div>
          <InvertTokensSeparator />
          <TokenInputCard form={form} side="Buy" />
          <Button className="rounded-none">Review stop-loss order</Button>
        </CardContent>
      </Card>
    </Form>
  );
}
