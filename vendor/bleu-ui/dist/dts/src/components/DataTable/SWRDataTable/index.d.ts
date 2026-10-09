import React from "react";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableBody } from "./DataTableBody";
export declare const formatParamsToDataTable: (params: any, searchKey: any) => {
    columnFilters: {
        id: string;
        value: unknown;
    }[];
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting: any[];
} | {
    columnFilters?: undefined;
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting: any[];
} | {
    columnFilters: {
        id: string;
        value: unknown;
    }[];
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting?: undefined;
} | {
    columnFilters?: undefined;
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting?: undefined;
};
export declare const renderDataTableCell: ({ filters, column, row, selectedRows }: {
    filters: any;
    column: any;
    row: any;
    selectedRows: any;
}) => any;
export declare const defaultDataTableFilterFn: (row: any, id: any, filterValue: any) => any;
export declare const buildDataTableColumns: (columnsConfig: any, filters: any, selectedRows: any) => any;
export declare function SWRDataTable({ fetchPath, searchKey, defaultParams, hasDetails, action, setSelectedData, selectedRows, }: {
    action?: React.ReactNode;
    defaultParams?: Record<string, unknown>;
    fetchPath: string;
    hasDetails?: boolean;
    searchKey?: string;
    selectedRows?: any[];
    setSelectedData?: (data: any[]) => void;
}): import("react/jsx-runtime").JSX.Element;
export { DataTableHeader, DataTableBody };
//# sourceMappingURL=index.d.ts.map