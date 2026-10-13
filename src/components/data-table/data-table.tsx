import {
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bleu/ui";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import * as React from "react";

import { DataTablePagination } from "#/components/data-table/data-table-pagination";

interface DataTableProps<TData> extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The table instance returned from useDataTable hook with pagination, sorting, filtering, etc.
   * @type TanstackTable<TData>
   */
  table: TanstackTable<TData>;

  /**
   * The floating bar to render at the bottom of the table on row selection.
   * @default null
   * @type React.ReactNode | null
   * @example floatingBar={<TasksTableFloatingBar table={table} />}
   */
  floatingBar?: React.ReactNode | null;
  fillPanel?: boolean;
  emptyMessage?: React.ReactNode;
  notice?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  floatingBar = null,
  fillPanel = false,
  emptyMessage = "No results.",
  notice,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const isEmpty = !table.getRowModel().rows.length;
  return (
    <div
      className={cn(
        "w-full",
        fillPanel
          ? "flex h-full min-h-0 flex-1 flex-col gap-2.5"
          : "space-y-2.5",
        className,
      )}
      {...props}
    >
      {fillPanel ? <div className="shrink-0">{children}</div> : children}
      <div
        className={cn(
          "rounded-md border overflow-y-auto scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-primary scrollbar-track-background scrollbar-w-2",
          fillPanel
            ? "min-h-0 flex-1 max-h-none [&>div]:overflow-visible"
            : "max-h-96",
          fillPanel && isEmpty && "[&>div]:h-full",
        )}
      >
        <Table className={cn(fillPanel && isEmpty && "h-full")}>
          <TableHeader
            className={cn(
              "sticky top-0",
              fillPanel && "h-10 bg-background z-10",
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="">
            {notice && (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length}>
                  {notice}
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className={cn("text-center", fillPanel ? "h-full" : "h-24")}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className={cn("flex flex-col gap-2.5", fillPanel && "shrink-0")}>
        <DataTablePagination table={table} fillPanel={fillPanel} />
        {table.getFilteredSelectedRowModel().rows.length > 0 && floatingBar}
      </div>
    </div>
  );
}
