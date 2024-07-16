"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@bleu/ui";
import { useState } from "react";

import { useOrder } from "#/contexts/ordersContext";

export function RemoveDraftOrdersDialog({
  selectedIds,
  setSelectedIds,
}: {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}) {
  const { removeDraftOrders } = useOrder();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          type="button"
          disabled={!selectedIds.length}
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-[450px]">
          <div className="flex flex-col gap-2 w-full">
            <DialogTitle>Delete draft orders</DialogTitle>
            <span className="text-wrap">
              Are you sure you want to delete the all the selected draft orders?
            </span>
            <Button
              className="w-full mt-3"
              variant="destructive"
              type="button"
              onClick={() => {
                removeDraftOrders(selectedIds);
                setSelectedIds([]);
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
