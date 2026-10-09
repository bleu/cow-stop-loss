/// <reference types="react" />
import { TableOptions } from "@tanstack/react-table";
export declare function useTableState(initialState?: TableOptions<unknown[]>["state"]): {
    tableState: {
        pagination: import("@tanstack/react-table").PaginationState;
        rowSelection: import("@tanstack/react-table").RowSelectionState;
        columnVisibility: import("@tanstack/react-table").VisibilityState;
        columnFilters: import("@tanstack/react-table").ColumnFiltersState;
        sorting: import("@tanstack/react-table").SortingState;
        grouping: import("@tanstack/react-table").GroupingState;
        expanded: boolean | Record<string, boolean>;
    };
    setTableState: {
        setPagination: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/react-table").PaginationState>>;
        setRowSelection: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/react-table").RowSelectionState>>;
        setColumnVisibility: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/react-table").VisibilityState>>;
        setColumnFilters: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/react-table").ColumnFiltersState>>;
        setSorting: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/react-table").SortingState>>;
        setGrouping: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/react-table").GroupingState>>;
        setExpanded: import("react").Dispatch<import("react").SetStateAction<boolean | Record<string, boolean>>>;
    };
};
//# sourceMappingURL=useTableState.d.ts.map