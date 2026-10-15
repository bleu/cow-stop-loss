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

import { useUIStore } from "#/hooks/useUIState";

export function TxPendingDialog() {
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
            "data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-border/70 bg-card p-5 text-foreground shadow-2xl focus:outline-none sm:p-7",
          )}
        >
          <div className="flex w-full flex-col gap-3">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Transaction being processed
            </DialogTitle>
            <span className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Almost there! Your transaction is being processed. You can check
              the status of your transaction in the Safe App or track the order
              dashboard.
            </span>
            <Button
              className="mt-2 h-11 w-full rounded-xl"
              onClick={() => {
                setTxPendingDialogOpen(false);
              }}
            >
              Back to dashboard
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
