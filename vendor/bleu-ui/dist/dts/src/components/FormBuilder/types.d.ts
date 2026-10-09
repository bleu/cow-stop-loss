import React from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { Conditions } from "./evaluateConditions";
import { type CheckboxFieldProps } from "./fields/CheckboxField";
import { type DatePickerInputProps } from "./fields/DatePickerInput";
import { type FileUploadFieldProps } from "./fields/FileUploadField";
import { type InputFieldProps } from "./fields/InputField";
import { type RadioGroupFieldProps } from "./fields/RadioGroupField";
import { type RichTextEditorFieldProps } from "./fields/RichTextEditorField";
import { type SelectFieldProps } from "./fields/selects/SelectField";
import { type TextAreaFieldProps } from "./fields/TextAreaField";
import { type FieldArrayFieldProps } from "./fields/FieldArray";
import { buildForm } from "./buildForm";
export type FieldComponentType = (props: CommonFieldProps<BaseField>) => React.ReactNode | null;
export interface CommonFieldProps<T extends BaseField> {
    buildForm?: typeof buildForm;
    customComponents?: {
        [key: string]: FieldComponentType;
    };
    field: T;
    form: UseFormReturn<FieldValues>;
}
export interface BaseField {
    component?: React.ComponentType<CommonFieldProps<BaseField>>;
    conditions?: Conditions;
    defaultValue?: string;
    description?: string;
    disabled?: boolean | ((data: FieldValues) => boolean);
    index?: number;
    label?: string;
    mode?: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    tooltip?: string;
    type: string;
    value: string;
}
export type FormFieldProps = InputFieldProps | TextAreaFieldProps | CheckboxFieldProps | DatePickerInputProps | FileUploadFieldProps | SelectFieldProps | RadioGroupFieldProps | RichTextEditorFieldProps | FieldArrayFieldProps;
//# sourceMappingURL=types.d.ts.map