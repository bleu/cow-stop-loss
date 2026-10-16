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
            "bg-background/65 backdrop-blur-sm data-[state=open]:animate-overlayShow fixed inset-0 rounded-lg",
          )}
        />
        <DialogContent
          className={cn(
            "rescue-dialog data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 max-h-[85dvh] overflow-y-auto w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-border/70 bg-card p-5 text-foreground shadow-2xl focus:outline-none sm:p-7",
          )}
        >
          <div className="flex w-full flex-col gap-3">
            <div
              aria-hidden="true"
              className="rescue-hero-cow mx-auto h-24 w-20"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-secondary">
              Air rescue · In transit
            </p>
            <DialogTitle className="font-serif text-[28px] leading-tight tracking-tight">
              Transaction being processed
            </DialogTitle>
            <span className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Almost there! Your transaction is being processed. You can check
              the status of your transaction in the Safe App or track the order
              dashboard.
            </span>
            <Button
              className="rescue-primary-button mt-2 h-12 w-full rounded-2xl"
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
