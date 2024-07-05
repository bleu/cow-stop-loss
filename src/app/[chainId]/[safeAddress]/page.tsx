import { OrderTabs } from "#/components/OrdersTabs";
import { SwapCard } from "#/components/SwapCard";
import { TxPendingDialog } from "#/components/TxPendingDialog";
import { SwapCardContextProvider } from "#/contexts/swapCardContext";

export default function Page() {
  return (
    <>
      <TxPendingDialog />
      <div className="flex size-full mb-2 mt-16 px-8 flex gap-6">
        <div className="w-[600px]">
          <SwapCardContextProvider>
            <SwapCard />
          </SwapCardContextProvider>
        </div>
        <OrderTabs />
      </div>
    </>
  );
}
