import { BaseField } from "../types";
export interface DelegateFieldProps extends BaseField {
    delegateKey: string;
    options: Array<{
        delegateValue: string;
        value: string;
    }>;
}
export declare const DelegateField: (props: import("../types").CommonFieldProps<DelegateFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=DelegateField.d.ts.map