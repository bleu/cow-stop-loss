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
  tableClassName?: string;
  emptyMessage?: React.ReactNode;
  notice?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowLabel?: (row: TData) => string | undefined;
}

export function DataTable<TData>({
  table,
  floatingBar = null,
  fillPanel = false,
  tableClassName,
  emptyMessage = "No results.",
  notice,
  onRowClick,
  getRowLabel,
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
      {fillPanel && children ? (
        <div className="shrink-0">{children}</div>
      ) : (
        children
      )}
      <div
        role="region"
        aria-label="Table rows"
        tabIndex={0}
        className={cn(
          "rescue-table-viewport pixel-frame overflow-auto rounded-none border border-border/70 bg-background/35 scrollbar scrollbar-thumb-primary/50 scrollbar-track-background scrollbar-w-2",
          fillPanel
            ? "min-h-0 flex-1 max-h-none [&>div]:overflow-visible"
            : "max-h-96",
          fillPanel && isEmpty && "[&>div]:h-full",
        )}
      >
        <Table
          className={cn(
            fillPanel && "min-w-[420px] xl:min-w-[680px]",
            fillPanel && isEmpty && "h-full",
            tableClassName,
          )}
        >
          <TableHeader
            className={cn(
              "sticky top-0",
              fillPanel &&
                "z-10 h-12 border-b border-border/70 bg-background backdrop-blur-sm",
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      data-column={header.column.id}
                      className={cn(
                        "h-12 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground",
                      )}
                    >
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
                  className={cn(
                    "transition-colors",
                    onRowClick &&
                      getRowLabel?.(row.original) &&
                      "cursor-pointer hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  )}
                  onClick={
                    onRowClick && getRowLabel?.(row.original)
                      ? () => onRowClick(row.original)
                      : undefined
                  }
                  onKeyDown={
                    onRowClick && getRowLabel?.(row.original)
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  tabIndex={
                    onRowClick && getRowLabel?.(row.original) ? 0 : undefined
                  }
                  aria-label={getRowLabel?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      data-column={cell.column.id}
                      data-label={
                        typeof cell.column.columnDef.header === "string"
                          ? cell.column.columnDef.header
                          : cell.column.id
                      }
                      className="py-2.5 align-middle"
                    >
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
      {(table.getPageCount() > 1 ||
        table.getFilteredSelectedRowModel().rows.length > 0) && (
        <div className={cn("flex flex-col gap-2.5", fillPanel && "shrink-0")}>
          <DataTablePagination table={table} fillPanel={fillPanel} />
          {table.getFilteredSelectedRowModel().rows.length > 0 && floatingBar}
        </div>
      )}
    </div>
  );
}
