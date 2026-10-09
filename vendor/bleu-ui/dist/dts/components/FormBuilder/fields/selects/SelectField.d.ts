import { BaseField } from "../../types";
export interface SelectFieldProps extends BaseField {
    options?: Array<{
        label: string;
        tooltip?: string;
        value: string;
    }>;
}
export declare const SelectField: (props: import("../../types").CommonFieldProps<SelectFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=SelectField.d.ts.map