interface PlotProps {
    className?: string;
    config?: any;
    data?: any;
    layout?: any;
    responsive?: boolean;
    revision?: number;
    title?: string;
    toolTip?: string;
    useResizeHandler?: boolean;
}
export declare const defaultAxisLayout: {
    linewidth: number;
    automargin: boolean;
};
export declare const defaultPlotProps: {
    className: string;
    useResizeHandler: boolean;
    responsive: boolean;
    layout: {
        margin: {
            b: number;
            t: number;
            r: number;
        };
        plot_bgcolor: string;
        paper_bgcolor: string;
        xaxis: {
            linewidth: number;
            automargin: boolean;
        };
        yaxis: {
            linewidth: number;
            automargin: boolean;
        };
        modebar: {
            orientation: string;
        };
    };
    config: {
        displaylogo: boolean;
        showAxisRangeEntryBoxes: boolean;
        showSendToCloud: boolean;
        showEditInChartStudio: boolean;
        showLink: boolean;
        watermark: boolean;
        scrowZoom: boolean;
        lassoSelect: boolean;
    };
    revision: number;
};
export declare function PlotTitle({ title, tooltip, justifyCenter, classNames, }: {
    classNames?: string;
    justifyCenter?: boolean;
    title: string;
    tooltip?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function Plot(props: PlotProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Plot.d.ts.map