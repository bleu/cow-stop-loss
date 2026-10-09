import { BaseField } from "../types";
export interface TextAreaFieldProps extends BaseField {
    length?: {
        maximum?: number;
        minimum: number;
    };
    type: "textarea";
}
export declare const TextAreaField: (props: import("../types").CommonFieldProps<TextAreaFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=TextAreaField.d.ts.map