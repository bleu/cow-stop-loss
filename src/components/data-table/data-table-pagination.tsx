import { Button, cn } from "@bleu/ui";
import { type Table } from "@tanstack/react-table";

import { PixelIcon } from "#/components/ui/pixel-icon";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  fillPanel?: boolean;
}

export function DataTablePagination<TData>({
  table,
  fillPanel = false,
}: DataTablePaginationProps<TData>) {
  if (table.getPageCount() <= 1) return null;
  const pageButtonClassName = cn(
    "pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex size-11 p-0",
    fillPanel && "lg:size-7 lg:min-h-7 lg:min-w-7",
  );
  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse items-center justify-between p-1",
        fillPanel ? "gap-2" : "gap-4 overflow-auto sm:flex-row sm:gap-8",
      )}
    >
      {table.options.enableRowSelection !== false && (
        <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      )}
      <div
        className={cn(
          "flex items-center",
          fillPanel
            ? "w-full flex-wrap justify-between gap-2"
            : "flex-col-reverse gap-4 sm:flex-row sm:gap-6 lg:gap-8",
        )}
      >
        <div className="flex items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            className={pageButtonClassName}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <PixelIcon name="chevrons-left" className="size-4" />
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className={pageButtonClassName}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <PixelIcon name="chevron-left" className="size-4" />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className={pageButtonClassName}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <PixelIcon name="chevron-right" className="size-4" />
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className={pageButtonClassName}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <PixelIcon name="chevrons-right" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
