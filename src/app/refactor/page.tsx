import { ReviewOrdersDialog } from "#/components/ReviewOrdersDialog";
import { SwapCard } from "#/components/SwapCard";
import { SwapContextProvider } from "#/contexts/swapContext";

export default function Page() {
  return (
    <div className="size-full py-5 px-8 flex gap-6">
      <div className="flex h-full w-2/5">
        <SwapContextProvider>
          <SwapCard />
          <ReviewOrdersDialog />
        </SwapContextProvider>
      </div>
      <div className="h-full w-3/5 bg-destructive"></div>
    </div>
  );
}
