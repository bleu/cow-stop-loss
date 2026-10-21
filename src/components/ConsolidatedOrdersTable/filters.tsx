"use client";

import { Button, Popover, PopoverContent, PopoverTrigger } from "@bleu/ui";
import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { PixelIcon } from "#/components/ui/pixel-icon";
import type { Option } from "#/hooks/useDataTable";
import type { PlacementRow } from "#/lib/stopLossPlacement";

export interface PortfolioFilterField {
  label: string;
  value: "chainId" | "status";
  options: Option[];
}

export function PortfolioFilters({
  table,
  filterFields,
  children,
}: {
  table: Table<PlacementRow>;
  filterFields: PortfolioFilterField[];
  children: ReactNode;
}) {
  const filters = filterFields.map((field) => ({
    ...field,
    column: table.getColumn(field.value)!,
    selected:
      (table.getColumn(field.value)?.getFilterValue() as string[]) ?? [],
  }));
  const count = filters.reduce(
    (total, filter) => total + filter.selected.length,
    0,
  );
  const summary = filters
    .map(
      (filter) =>
        `${filter.label}: ${
          filter.selected.length
            ? filter.options
                .filter((option) => filter.selected.includes(option.value))
                .map((option) => option.label)
                .join(", ")
            : "All"
        }`,
    )
    .join(" / ");

  return (
    <>
      <div className="rescue-portfolio-toolbar">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Filters"
              aria-description={
                count ? `${count} selected filters` : "All chains and statuses"
              }
              className="rescue-secondary-control pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 gap-2 rounded-none px-2 text-muted-foreground hover:text-primary lg:h-7 lg:min-h-7 lg:gap-1.5 lg:text-xs"
            >
              <PixelIcon name="filter" className="size-4" />
              Filters
              <span
                className="min-w-5 bg-primary/10 px-1 text-center text-xs text-primary"
                aria-hidden="true"
              >
                {count || "All"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            aria-label="Filter your orders"
            className="rescue-portfolio-filter-panel pixel-frame rounded-none p-4"
          >
            <p className="mb-3 text-sm font-semibold">Filter your orders</p>
            <div className="rescue-portfolio-filter-groups">
              {filters.map((filter) => (
                <fieldset key={filter.value} className="min-w-0">
                  <legend className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {filter.label}
                  </legend>
                  <label className="rescue-portfolio-filter-option">
                    <input
                      type="checkbox"
                      checked={filter.selected.length === 0}
                      onChange={() => filter.column.setFilterValue(undefined)}
                    />
                    All {filter.value === "chainId" ? "chains" : "statuses"}
                  </label>
                  {filter.options.map((option) => (
                    <label
                      key={option.value}
                      className="rescue-portfolio-filter-option"
                    >
                      <input
                        type="checkbox"
                        checked={filter.selected.includes(option.value)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...filter.selected, option.value]
                            : filter.selected.filter(
                                (value) => value !== option.value,
                              );
                          filter.column.setFilterValue(
                            next.length ? next : undefined,
                          );
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {children}
        <Button
          type="button"
          variant="ghost"
          aria-label="Reset filters"
          disabled={count === 0}
          onClick={() => table.resetColumnFilters()}
          className="rescue-portfolio-filter-reset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 gap-1 rounded-none px-1 text-[11px] text-muted-foreground hover:text-primary lg:h-7"
        >
          <PixelIcon name="close" className="size-3" />
          Reset
        </Button>
      </div>
      <p
        aria-label="Selected filters"
        title={summary}
        className="rescue-portfolio-filter-summary"
      >
        {summary}
      </p>
    </>
  );
}
