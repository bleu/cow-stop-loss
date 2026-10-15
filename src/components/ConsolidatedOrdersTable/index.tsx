"use client";

import {
  Button,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@bleu/ui";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

import { DataTable } from "#/components/data-table/data-table";
import { DataTableToolbar } from "#/components/data-table/data-table-toolbar";
import { NetworkLogo } from "#/components/NetworkLogo";
import { DataTableFilterField, useDataTable } from "#/hooks/useDataTable";
import { useOrderList } from "#/hooks/useOrderList";
import { chainNames, supportedChainIds } from "#/lib/publicClients";
import { PlacementRow } from "#/lib/stopLossPlacement";

import { getColumns } from "./columns";

const filterFields: DataTableFilterField<PlacementRow>[] = [
  {
    label: "Chain",
    value: "chainId",
    options: Object.entries(chainNames).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    label: "Status",
    value: "status",
    options: [
      "Open",
      "Filled",
      "Canceled",
      "Expired",
      "Partially filled, cancelled",
      "Partially filled, expired",
    ].map((value) => ({ value, label: value })),
  },
];

export type ConsolidatedOrderType = PlacementRow;

export function ConsolidatedOrdersTable() {
  const { address } = useAccount();
  if (!address) return <WalletRequiredOrders />;
  return <ConnectedOrdersTable account={address} />;
}

function WalletRequiredOrders() {
  const { openConnectModal } = useConnectModal();
  return (
    <div className="my-auto flex w-full flex-col rounded-2xl border border-dashed border-border bg-background/55 p-5 sm:p-7 lg:max-w-2xl lg:self-center">
      <div className="mb-5 flex -space-x-2">
        {supportedChainIds.map((chainId) => (
          <NetworkLogo
            key={chainId}
            chainId={chainId}
            size={34}
            className="rounded-full border-2 border-card"
          />
        ))}
      </div>
      <h3 className="text-xl font-semibold tracking-tight">
        Your orders, all in one place
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Connect your wallet to see stop-loss orders across Ethereum, Gnosis,
        Arbitrum, and Sepolia.
      </p>
      <Button
        type="button"
        className="mt-5 h-11 w-fit rounded-xl bg-secondary px-4 font-semibold text-secondary-foreground hover:bg-secondary/90"
        onClick={openConnectModal}
      >
        Connect wallet to view orders
      </Button>
    </div>
  );
}

function ConnectedOrdersTable({ account }: { account: Address }) {
  const router = useRouter();
  const { orders, chains, isLoading, mutate, trackingError } = useOrderList();
  const columns = useMemo(() => getColumns(account), [account]);
  const { table } = useDataTable({
    data: orders,
    columns,
    initialColumnVisibility: { chainId: false },
    filterFields,
    defaultSort: "chainId.asc",
    enableRowSelection: false,
  });

  const isInitialLoading = isLoading && !chains.length && !orders.length;
  const hasAvailableOrders =
    orders.length > 0 || chains.some((chain) => chain.status === "success");
  const emptyMessage = isInitialLoading ? (
    <p role="status">Loading stop-loss orders...</p>
  ) : hasAvailableOrders ? (
    "No results."
  ) : (
    "Orders are unavailable on all supported chains."
  );

  const failedChains = chains.filter((chain) => chain.status === "error");
  const notice = (trackingError || failedChains.length > 0) && (
    <div className="space-y-4 text-left">
      {trackingError && (
        <p role="alert" className="rounded border border-destructive p-3">
          Placement tracking is unavailable. {trackingError}
        </p>
      )}
      {failedChains.map((chain) => (
        <div
          key={chain.chainId}
          role="alert"
          className="rounded border border-destructive p-3"
        >
          <p>{chainNames[chain.chainId]} orders are unavailable.</p>
          <p>{chain.error}</p>
          {chain.orders.length > 0 && (
            <p>
              Previously loaded {chainNames[chain.chainId]} orders may be out of
              date.
            </p>
          )}
          <button
            disabled={isLoading}
            onClick={() => mutate()}
            className="text-primary underline"
          >
            Retry {chainNames[chain.chainId]}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <DataTable
        table={table}
        fillPanel
        onRowClick={(row: PlacementRow) => {
          if (row.canLink)
            router.push(
              `/${row.chainId}/${account}/${encodeURIComponent(row.parentId)}`,
            );
        }}
        getRowLabel={(row: PlacementRow) =>
          row.canLink
            ? `View order ${row.parentId} on ${chainNames[row.chainId]}`
            : undefined
        }
        emptyMessage={emptyMessage}
        notice={notice}
      >
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          afterFilters={
            <TooltipProvider>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 shrink-0 rounded-xl border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    aria-label="Refresh orders"
                    aria-busy={isLoading}
                    disabled={isLoading}
                    onClick={() => mutate()}
                  >
                    <ReloadIcon
                      aria-hidden="true"
                      className={`size-4 ${isLoading ? "motion-safe:animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh orders</TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          }
        />
      </DataTable>
    </div>
  );
}
