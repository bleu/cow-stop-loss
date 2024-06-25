"use client";

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@bleu/ui";

import { useSwapContext } from "#/contexts/swapContext";

import { DraftOrdersTab } from "./DraftOrdersTab";

export function OrderTabs() {
  const { draftOrders } = useSwapContext();

  return (
    <TabsRoot className="w-full flex flex-col gap-2" defaultValue="draft">
      <div className="flex flex-row justify-between items-center">
        <span className="text-2xl font-semibold">Your orders</span>
        <TabsList>
          <TabsTrigger value="draft">Draft ({draftOrders.length})</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </div>
      <div className="flex rounded-md text-background bg-foreground p-2">
        <TabsContent className="w-full" value="draft">
          <DraftOrdersTab />
        </TabsContent>
        <TabsContent className="w-full" value="open">
          Open
        </TabsContent>
        <TabsContent className="w-full" value="history">
          History
        </TabsContent>
      </div>
    </TabsRoot>
  );
}
