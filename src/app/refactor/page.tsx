import { OrderTabs } from "#/components/OrdersTabs";
import { SwapCard } from "#/components/SwapCard";
import { SwapCardContextProvider } from "#/contexts/swapCardContext";

export default function Page() {
  return (
    <div className="size-full py-5 px-8 flex gap-6">
      <div className="flex w-[600px]">
        <SwapCardContextProvider>
          <SwapCard />
        </SwapCardContextProvider>
      </div>
      <div className="size-full">
        <OrderTabs />
      </div>
    </div>
  );
}
