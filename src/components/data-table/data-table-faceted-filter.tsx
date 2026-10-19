import {
  Badge,
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@bleu/ui";
import { CheckIcon } from "@radix-ui/react-icons";
import type { Column } from "@tanstack/react-table";

import { PixelIcon } from "#/components/ui/pixel-icon";
import { Option } from "#/hooks/useDataTable";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={title}
          className="rescue-secondary-control pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 gap-2 rounded-none px-2 text-muted-foreground hover:text-primary"
        >
          <PixelIcon name="filter" className="size-4" />
          {title}
          {selectedValues.size === 0 && (
            <Badge
              variant="secondary"
              className="rounded-none border-0 bg-transparent p-0 font-normal text-muted-foreground"
            >
              All
            </Badge>
          )}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge
                variant="secondary"
                className="pixel-badge rounded-none px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="pixel-badge rounded-none px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="pixel-badge rounded-none px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="pixel-frame w-[12.5rem] p-0" align="start">
        <Command className="rounded-none">
          <CommandInput className="rounded-none" placeholder={title} />
          <CommandList aria-multiselectable="true">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                className="rounded-none"
                aria-label="All"
                aria-checked={selectedValues.size === 0}
                onSelect={() => column?.setFilterValue(undefined)}
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    "mr-2 flex size-4 items-center justify-center rounded-none border border-primary",
                    selectedValues.size === 0
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible",
                  )}
                >
                  <CheckIcon className="size-4" aria-hidden="true" />
                </div>
                <span>All</span>
              </CommandItem>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);

                return (
                  <CommandItem
                    className="rounded-none"
                    key={option.value}
                    aria-label={option.label}
                    aria-checked={isSelected}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined,
                      );
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className={cn(
                        "mr-2 flex size-4 items-center justify-center rounded-none border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className="size-4" aria-hidden="true" />
                    </div>
                    {option.icon && (
                      <option.icon
                        className="mr-2 size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <span>{option.label}</span>
                    {option.withCount &&
                      column?.getFacetedUniqueValues()?.get(option.value) && (
                        <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                          {column?.getFacetedUniqueValues().get(option.value)}
                        </span>
                      )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
