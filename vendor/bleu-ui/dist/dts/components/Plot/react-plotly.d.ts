import React from "react";
interface PlotlyComponentProps {
    className?: string;
    config?: any;
    data?: any[];
    debug?: boolean;
    divId?: string;
    frames?: any[];
    layout?: any;
    onError?: (err: any) => void;
    onInitialized?: (figure: any, graphDiv: any) => void;
    onPurge?: (figure: any) => void;
    onUpdate?: (figure: any, graphDiv: any) => void;
    revision?: number;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
}
export default function PlotlyComponent(props: PlotlyComponentProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=react-plotly.d.ts.map