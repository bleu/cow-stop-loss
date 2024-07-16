"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@bleu/ui";
import cn from "clsx";

import { useTxManager } from "#/hooks/useTxManager";
import { useUIStore } from "#/hooks/useUIState";

export function TxPendingDialog() {
  const { isPonderUpdating } = useTxManager();

  const [txPendingDialogOpen, setTxPendingDialogOpen] = useUIStore((state) => [
    state.txPendingDialogOpen,
    state.setTxPendingDialogOpen,
  ]);

  return (
    <Dialog open={txPendingDialogOpen} onOpenChange={setTxPendingDialogOpen}>
      <DialogPortal>
        <DialogOverlay
          id="dialog-overlay"
          className={cn(
            "bg-black/20 data-[state=open]:animate-overlayShow fixed inset-0 rounded-lg",
          )}
        />
        <DialogContent
          className={cn(
            "data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-lg focus:outline-none bg-foreground  w-[90vw] max-w-[450px] p-[25px]",
          )}
        >
          <div className="flex flex-col gap-2 w-full">
            <DialogTitle className="text-2xl font-medium ">
              Transaction pending
            </DialogTitle>
            <span className="text-wrap">
              {isPonderUpdating ? "Almost done" : "Done"}!
            </span>
            <Button
              className="w-full mt-3"
              onClick={() => {
                setTxPendingDialogOpen(false);
              }}
              disabled={isPonderUpdating}
            >
              {isPonderUpdating
                ? "Processing transaction..."
                : "Back to the dashboard"}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
