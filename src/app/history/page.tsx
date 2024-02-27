import { OrderTableWrapper } from "./(components)/OrderTableWrapper";

export default function HistoryPage() {
  return (
    <div className="flex w-full justify-center">
      <div className="my-10 flex w-9/12 flex-col gap-y-5">
        <div className="flex items-center justify-between gap-x-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl text-slate12">My Stop Loss orders</h1>
          </div>
        </div>
        <OrderTableWrapper />
      </div>
    </div>
  );
}
