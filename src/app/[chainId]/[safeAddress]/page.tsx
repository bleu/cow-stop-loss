import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { SwapCard } from "#/components/swap-card/SwapCard";
import { TxPendingDialog } from "#/components/TxPendingDialog";

export default function Page({
  params,
}: {
  params: {
    chainId: number;
    safeAddress: string;
  };
}) {
  // TODO: COW-237

  if (params.chainId != 11155111) {
    throw new Error("Invalid chainId");
  }
  return (
    <>
      <TxPendingDialog />
      <div className="grid grid-cols-3 p-8 gap-4">
        <div className="col-span-1">
          <SwapCard />
        </div>
        <div className="col-span-2">
          <ConsolidatedOrdersTable />
        </div>
      </div>
    </>
  );
}
