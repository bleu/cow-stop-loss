"use client";

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@bleu/ui";
import { ReloadIcon } from "@radix-ui/react-icons";

import { useOrder } from "#/contexts/ordersContext";
import { useSwapCardContext } from "#/contexts/swapCardContext";

import { DraftOrdersTab } from "./DraftOrdersTab";
import { HistoryOrdersTab } from "./HistoryOrdersTab";
import { OpenOrdersTab } from "./OpenOrdersTab";
import { Spinner } from "./Spinner";

export function OrderTabs() {
  const {
    isLoading,
    mutate,
    openOrders,
    historyOrders,
    draftOrders,
    txManager: { isPonderUpdating },
  } = useOrder();
  const { firstAccess } = useSwapCardContext();

  if (firstAccess) {
    return null;
  }

  const isUpdating = isLoading || isPonderUpdating;
  return (
    <TabsRoot
      className="w-3/4 h-[70vh] flex flex-col gap-2"
      defaultValue="draft"
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex gap-2 items-center">
          <span className="text-2xl font-semibold">Your orders</span>
          {isUpdating ? (
            <Spinner size="sm" />
          ) : (
            <button
              onClick={() => {
                mutate();
              }}
              className="text-primary hover:text-primary/50 px-1"
            >
              <ReloadIcon className="size-4" />
            </button>
          )}
        </div>
        <TabsList>
          <TabsTrigger className="data-[state=active]:text-white" value="draft">
            Draft{draftOrders.length > 0 && ` (${draftOrders.length})`}
          </TabsTrigger>
          <TabsTrigger className="data-[state=active]:text-white" value="open">
            Open{openOrders.length > 0 && ` (${openOrders.length})`}
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:text-white"
            value="history"
          >
            History{historyOrders.length > 0 && ` (${historyOrders.length})`}
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="flex rounded-lg bg-foreground p-2 max-h-[70vh] overflow-y-scroll scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-primary scrollbar-track-background scrollbar-w-4">
        <TabsContent className="w-full" value="draft">
          <DraftOrdersTab />
        </TabsContent>
        <TabsContent className="w-full" value="open">
          <OpenOrdersTab />
        </TabsContent>
        <TabsContent className="w-full" value="history">
          <HistoryOrdersTab />
        </TabsContent>
      </div>
    </TabsRoot>
  );
}
