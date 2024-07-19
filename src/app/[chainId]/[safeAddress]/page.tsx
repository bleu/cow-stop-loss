import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { SwapCard } from "#/components/swap-card/SwapCard";
import { TxPendingDialog } from "#/components/TxPendingDialog";

export default function Page() {
  return (
    <>
      <TxPendingDialog />
      <div className="grid grid-cols-1 md:grid-cols-3 p-8 gap-4">
        <div className="md:col-span-1">
          <SwapCard />
        </div>
        <div className="md:col-span-2">
          <ConsolidatedOrdersTable />
        </div>
      </div>
    </>
  );
}
