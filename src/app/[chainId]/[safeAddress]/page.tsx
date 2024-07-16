import { OrderTabs } from "#/components/OrdersTabs";
import { SwapCard } from "#/components/swap-card/SwapCard";
import { TxPendingDialog } from "#/components/TxPendingDialog";

export default function Page() {
  return (
    <>
      <TxPendingDialog />
      <div className="flex size-full mb-2 mt-16 px-8 gap-6">
        <div className="mx-auto w-1/3">
          <SwapCard />
        </div>
        <OrderTabs />
      </div>
    </>
  );
}
