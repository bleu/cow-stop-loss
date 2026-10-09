import { BaseField, CommonFieldProps, FieldComponentType } from "./types";
export declare function buildForm(fields: CommonFieldProps<BaseField>["field"][], form: CommonFieldProps<BaseField>["form"], index?: number, customComponents?: {
    [key: string]: FieldComponentType;
}): (import("react/jsx-runtime").JSX.Element | null)[];
export declare const parseFields: (fields: any, index: any) => any;
//# sourceMappingURL=buildForm.d.ts.map