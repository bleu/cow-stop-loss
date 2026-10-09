import { FormFieldProps, BaseField } from "../types";
export interface FieldArrayFieldProps extends BaseField {
    _destroy?: boolean;
    defaultValues: Record<string, unknown>;
    fields: Array<FormFieldProps>;
    hasSequence: boolean;
    length?: {
        maximum?: number;
        minimum?: number;
    };
    remove?: boolean;
    sequence_field?: string;
    style?: {
        border?: "none" | "normal";
        gap?: "small" | "medium" | "large";
        layout?: "stack" | "inline";
    };
    type: "field_array";
}
export declare const FieldArray: (props: import("../types").CommonFieldProps<FieldArrayFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FieldArray.d.ts.map