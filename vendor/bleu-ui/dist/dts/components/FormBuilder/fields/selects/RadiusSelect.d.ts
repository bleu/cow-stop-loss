import { BaseField } from "../../types";
export interface RadiusOption {
    classes: string;
    label: string;
    value: string;
}
export interface RadiusSelectFieldProps extends BaseField {
    options: RadiusOption[];
}
export declare const RadiusSelect: (props: import("../../types").CommonFieldProps<RadiusSelectFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=RadiusSelect.d.ts.map