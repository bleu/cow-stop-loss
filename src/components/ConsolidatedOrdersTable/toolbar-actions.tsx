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
import { type Table } from "@tanstack/react-table";
import React, { useState } from "react";

import { useDraftOrders } from "#/hooks/useDraftOrders";
import { useTxManager } from "#/hooks/useTxManager";
import { useUIStore } from "#/hooks/useUIState";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";
import { DraftOrder, StopLossOrderType } from "#/lib/types";

import { type ConsolidatedOrderType } from "../ConsolidatedOrdersTable";
import { ReviewOrdersDialog } from "../ReviewOrdersDialog";

interface ConsolidatedOrdersTableToolbarActionsProps {
  table: Table<ConsolidatedOrderType>;
}

export function ConsolidatedOrdersTableToolbarActions({
  table,
}: ConsolidatedOrdersTableToolbarActionsProps) {
  const { writeContract, isWriting } = useTxManager();
  const setTxPendingDialogOpen = useUIStore(
    (state) => state.setTxPendingDialogOpen,
  );

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const selectedOrders = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const selectedDraftOrders = selectedOrders.filter(
    (order) => order.status === "draft",
  ) as DraftOrder[];
  const selectedOpenOrders = selectedOrders.filter(
    (order) => order.status === "open",
  ) as StopLossOrderType[];

  const onCancelOrders = () => {
    const deleteTxArgs = selectedOpenOrders.map((order) => ({
      type: TRANSACTION_TYPES.ORDER_CANCEL,
      hash: order.hash,
    })) as OrderCancelArgs[];
    writeContract(deleteTxArgs, {
      onSuccess: () => {
        table.resetRowSelection();
        setTxPendingDialogOpen(true);
      },
    });
  };

  const onReviewDraftOrders = () => {
    setReviewDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReviewDraftOrders}
          disabled={selectedDraftOrders.length === 0}
        >
          Review {selectedDraftOrders.length > 1 ? "Orders" : "Order"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancelOrders}
          disabled={isWriting || selectedOpenOrders.length === 0}
        >
          {isWriting
            ? "Cancelling..."
            : `Cancel ${selectedOpenOrders.length > 1 ? "Orders" : "Order"}`}
        </Button>
      </div>
      <RemoveDraftOrdersDialog
        selectedIds={selectedDraftOrders.map((order) => order.id)}
        setSelectedIds={() => table.resetRowSelection()}
      />
      <ReviewOrdersDialog
        open={reviewDialogOpen}
        setOpen={setReviewDialogOpen}
        draftOrders={selectedDraftOrders}
      />
    </>
  );
}

export function RemoveDraftOrdersDialog({
  selectedIds,
  setSelectedIds,
}: {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}) {
  const { removeDraftOrders } = useDraftOrders();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
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
