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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip-primitive";

interface ConsolidatedOrdersTableToolbarActionsProps {
  table: Table<ConsolidatedOrderType>;
}

const DRAFT_ORDER_ACTIONS_DISABLED_TOOLTIP =
  "You can perform this action when only draft orders are selected";
const OPEN_ORDER_ACTIONS_DISABLED_TOOLTIP =
  "You can perform this action when only open orders are selected";

export function ConsolidatedOrdersTableToolbarActions({
  table,
}: ConsolidatedOrdersTableToolbarActionsProps) {
  const { writeContract } = useTxManager();
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

  const hasSelectedDraftOrders = selectedDraftOrders.length > 0;
  const hasSelectedOpenOrders = selectedOpenOrders.length > 0;

  const draftOrderActionsDisabled =
    !hasSelectedDraftOrders || hasSelectedOpenOrders;
  const openOrderActionsDisabled =
    !hasSelectedOpenOrders || hasSelectedDraftOrders;

  return (
    <>
      <div className="grid gap-2 md:grid-flow-col justify-items-end">
        <TooltipWrapper
          showTooltip={draftOrderActionsDisabled}
          tooltipText={DRAFT_ORDER_ACTIONS_DISABLED_TOOLTIP}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onReviewDraftOrders}
            disabled={draftOrderActionsDisabled}
          >
            Review{" "}
            {hasSelectedDraftOrders ? `${selectedDraftOrders.length} ` : ""}
            Draft {selectedDraftOrders.length > 1 ? "Orders" : "Order"}
          </Button>
        </TooltipWrapper>
        <RemoveDraftOrdersDialog
          selectedIds={selectedDraftOrders.map((order) => order.id)}
          setSelectedIds={() => table.resetRowSelection()}
          disabled={draftOrderActionsDisabled}
        />
        <TooltipWrapper
          showTooltip={openOrderActionsDisabled}
          tooltipText={OPEN_ORDER_ACTIONS_DISABLED_TOOLTIP}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelOrders}
            disabled={openOrderActionsDisabled}
          >
            Cancel{" "}
            {hasSelectedOpenOrders ? `${selectedOpenOrders.length} ` : ""}
            {selectedOpenOrders.length > 1 ? "Orders" : "Order"}{" "}
          </Button>
        </TooltipWrapper>
      </div>
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
  disabled,
}: {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  disabled: boolean;
}) {
  const { removeDraftOrders } = useDraftOrders();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TooltipWrapper
          showTooltip={disabled}
          tooltipText={DRAFT_ORDER_ACTIONS_DISABLED_TOOLTIP}
        >
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            Delete {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}
            Draft {selectedIds.length > 1 ? "Orders" : "Order"}{" "}
          </Button>
        </TooltipWrapper>
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

function TooltipWrapper({
  children,
  showTooltip,
  tooltipText,
}: {
  children: React.ReactNode;
  showTooltip: boolean;
  tooltipText: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        {showTooltip && (
          <TooltipContent className="bg-primary text-primary-foreground text-sm">
            {tooltipText}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
