export declare function useSWRDataTable(path: any, initialSearch?: {}, options?: {}): {
    data: any;
    error: any;
    isLoading: boolean;
    tableState: {
        pagination: import("@tanstack/table-core").PaginationState;
        rowSelection: import("@tanstack/table-core").RowSelectionState;
        columnVisibility: import("@tanstack/table-core").VisibilityState;
        columnFilters: import("@tanstack/table-core").ColumnFiltersState;
        sorting: import("@tanstack/table-core").SortingState;
        grouping: import("@tanstack/table-core").GroupingState;
        expanded: boolean | Record<string, boolean>;
    };
    setTableState: {
        setPagination: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/table-core").PaginationState>>;
        setRowSelection: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/table-core").RowSelectionState>>;
        setColumnVisibility: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/table-core").VisibilityState>>;
        setColumnFilters: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/table-core").ColumnFiltersState>>;
        setSorting: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/table-core").SortingState>>;
        setGrouping: import("react").Dispatch<import("react").SetStateAction<import("@tanstack/table-core").GroupingState>>;
        setExpanded: import("react").Dispatch<import("react").SetStateAction<boolean | Record<string, boolean>>>;
    };
};
//# sourceMappingURL=useSWRDataTable.d.ts.map