import {
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@bleu-fi/ui";
import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { useRawTxData } from "#/hooks/useRawTxData";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";

interface ICancelOrdersDialog {
  defaultOpen?: boolean;
  ordersToCancel: string[];
  disabled: boolean;
  tableRow?: boolean;
}

export function CancelOrdersDialog({
  defaultOpen = false,
  ordersToCancel,
  disabled,
  tableRow = false,
}: ICancelOrdersDialog) {
  const [open, setOpen] = useState(false);
  const { sendTransactions } = useRawTxData();

  async function cancelOrders(ordersHash: string[]) {
    const ordersHashArray = Array.isArray(ordersHash)
      ? ordersHash
      : [ordersHash];

    const cancelTransactionsData = ordersHashArray.map(
      (orderHash) =>
        ({
          type: TRANSACTION_TYPES.ORDER_CANCEL,
          hash: orderHash,
        }) as OrderCancelArgs,
    );

    await sendTransactions(cancelTransactionsData);
  }

  return (
    <Dialog
    defaultOpen={defaultOpen}
      //  @ts-expect-error TS(2322) FIXME: Type '{ children: Element; className: string; }' i... Remove this comment to see the full error message
      className="max-w-none"
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
          <Button
            variant={tableRow ? "ghost" : "destructive"}
            disabled={disabled}
            className={cn(tableRow && "hover:bg-transparent")}
          >
            <span className="flex items-center gap-x-2">
              <TrashIcon
                className={cn(
                  "size-5",
                  disabled && tableRow
                    ? "text-slate10"
                    : "text-destructive/70 hover:text-destructive",
                  !tableRow && "text-white",
                )}
              />
              {!tableRow && "Cancel Orders"}
            </span>
          </Button>
      </DialogTrigger>
      <DialogContent className="bg-blue3 border-0 text-white flex flex-col items-center">
        <h2 className="text-xl font-semibold">Are you sure?</h2>
        <span>
          You are about to cancel {ordersToCancel.length}{" "}
          {ordersToCancel.length > 1 ? "orders" : "order"}
        </span>
        <div className="flex gap-x-2">
          <DialogClose asChild>
            <Button variant="outline" className="text-black">
              <span> No, keep orders</span>
            </Button>
          </DialogClose>

          <Button
            className="w-full"
            variant="destructive"
            disabled={disabled}
            onClick={() => {
              cancelOrders(ordersToCancel);
              setOpen(false);
            }}
          >
            <span className="flex items-center gap-x-2">
              <TrashIcon />
              <span> Yes, cancel orders</span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
