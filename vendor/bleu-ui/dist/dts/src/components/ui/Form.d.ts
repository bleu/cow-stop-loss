import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
    name: TName;
};
declare const Form: ({ children, className, action, method, onSubmit, encType, ...props }: {
    action?: string;
    children: React.ReactNode;
    className?: string;
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data";
    method?: "get" | "post";
    onSubmit?: React.FormEventHandler<HTMLFormElement> | (() => void);
}) => import("react/jsx-runtime").JSX.Element;
export declare const FormFieldProvider: <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ children, ...props }: React.PropsWithChildren<ControllerProps<TFieldValues, TName>>) => import("react/jsx-runtime").JSX.Element;
declare const FormField: <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>) => import("react/jsx-runtime").JSX.Element;
export declare const useFormFieldState: () => FormFieldContextValue<FieldValues, string>;
export declare const useFormFieldUpdater: () => React.Dispatch<React.SetStateAction<FormFieldContextValue<FieldValues, string>>>;
export declare const FormItemProvider: ({ children, }: React.HTMLAttributes<HTMLDivElement>) => import("react/jsx-runtime").JSX.Element;
declare const FormItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const useFormField: () => {
    invalid: boolean;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
    error?: import("react-hook-form").FieldError | undefined;
    id: string;
    name: string;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
};
declare const FormLabel: React.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>, "ref"> & {
    tooltip?: string | undefined;
} & React.RefAttributes<HTMLLabelElement>>;
declare const FormControl: React.ForwardRefExoticComponent<Omit<import("@radix-ui/react-slot").SlotProps & React.RefAttributes<HTMLElement>, "ref"> & React.RefAttributes<HTMLElement>>;
declare const FormDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const FormMessage: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField, };
//# sourceMappingURL=Form.d.ts.map