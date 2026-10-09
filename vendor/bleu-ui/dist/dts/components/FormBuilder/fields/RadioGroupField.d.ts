import { BaseField } from "../types";
export interface RadioGroupFieldProps extends BaseField {
    sections: Array<{
        description: string;
        label: string;
        options: Array<{
            label: string;
            tooltip?: string;
            value: string;
        }>;
    }>;
}
export declare const RadioGroupField: (props: import("../types").CommonFieldProps<RadioGroupFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=RadioGroupField.d.ts.map