import { FieldValues, UseFormReturn } from "react-hook-form";
export interface Conditions {
    [key: string]: any;
    allOf?: Conditions[];
    anyOf?: Conditions[];
}
export declare const evaluateConditions: (form: UseFormReturn<FieldValues>, conditions?: Conditions | undefined, index?: number) => boolean;
//# sourceMappingURL=evaluateConditions.d.ts.map