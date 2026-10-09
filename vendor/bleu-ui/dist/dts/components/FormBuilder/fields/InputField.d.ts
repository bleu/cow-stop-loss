import { BaseField } from "../types";
export interface InputFieldProps extends BaseField {
    length?: {
        maximum?: number;
        minimum: number;
    };
    mode: "text" | "number";
    type: "input";
}
export declare const InputField: (props: import("../types").CommonFieldProps<InputFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=InputField.d.ts.map