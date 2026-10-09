import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import React__default, { PropsWithChildren } from 'react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import * as _tanstack_table_core from '@tanstack/table-core';
import * as _tanstack_react_table from '@tanstack/react-table';
import { TableOptions } from '@tanstack/react-table';
import * as react_hook_form from 'react-hook-form';
import { FieldValues, FieldPath, ControllerProps, UseFormReturn } from 'react-hook-form';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DialogProps } from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as _radix_ui_react_slot from '@radix-ui/react-slot';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as ToastPrimitives from '@radix-ui/react-toast';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { DroppableProps } from 'react-beautiful-dnd';
import { ClassValue } from 'clsx';
import i18n from 'i18next';

declare const AlertDialog: React.FC<AlertDialogPrimitive.AlertDialogProps>;
declare const AlertDialogTrigger: React.ForwardRefExoticComponent<AlertDialogPrimitive.AlertDialogTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const AlertDialogPortal: React.FC<AlertDialogPrimitive.AlertDialogPortalProps>;
declare const AlertDialogOverlay: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogOverlayProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const AlertDialogContent: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const AlertDialogHeader: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const AlertDialogFooter: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const AlertDialogTitle: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogTitleProps & React.RefAttributes<HTMLHeadingElement>, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
declare const AlertDialogDescription: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
declare const AlertDialogAction: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogActionProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const AlertDialogCancel: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogCancelProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=AlertDialog.d.ts.map

declare const Avatar: React.ForwardRefExoticComponent<Omit<AvatarPrimitive.AvatarProps & React.RefAttributes<HTMLSpanElement>, "ref"> & React.RefAttributes<HTMLSpanElement>>;
declare const AvatarImage: React.ForwardRefExoticComponent<Omit<AvatarPrimitive.AvatarImageProps & React.RefAttributes<HTMLImageElement>, "ref"> & React.RefAttributes<HTMLImageElement>>;
declare const AvatarFallback: React.ForwardRefExoticComponent<Omit<AvatarPrimitive.AvatarFallbackProps & React.RefAttributes<HTMLSpanElement>, "ref"> & React.RefAttributes<HTMLSpanElement>>;
//# sourceMappingURL=Avatar.d.ts.map

declare const badgeVariants: (props?: ({
    color?: "destructive" | "secondary" | "primary" | "success" | "pending" | null | undefined;
    outline?: "none" | "outline" | null | undefined;
    size?: "sm" | "lg" | "xs" | "md" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends React.PropsWithChildren<VariantProps<typeof badgeVariants> & {
    className?: string;
}> {
}
declare const Badge: ({ className, color, outline, size, ...props }: PropsWithChildren<BadgeProps>) => react_jsx_runtime.JSX.Element;

declare const buttonVariants: (props?: ({
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
    loadingText?: string;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

declare function Calendar({ withTime, className, classNames, showOutsideDays, selected, onSelect: setSelected, ...props }: {
    [x: string]: any;
    withTime?: boolean | undefined;
    className: any;
    classNames: any;
    showOutsideDays?: boolean | undefined;
    selected: any;
    onSelect: any;
}): react_jsx_runtime.JSX.Element;
declare namespace Calendar {
    var displayName: string;
}
//# sourceMappingURL=Calendar.d.ts.map

declare const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Card.d.ts.map

declare const Checkbox: React.ForwardRefExoticComponent<Omit<CheckboxPrimitive.CheckboxProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=Checkbox.d.ts.map

declare const Command: React.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Pick<Pick<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "asChild" | "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    label?: string;
    shouldFilter?: boolean;
    filter?: (value: string, search: string, keywords?: string[]) => number;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    loop?: boolean;
    disablePointerSelection?: boolean;
    vimBindings?: boolean;
} & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
type CommandDialogProps = DialogProps & {
    className?: string;
    loading: React.ReactNode;
};
declare const CommandDialog: ({ children, loading, ...props }: CommandDialogProps) => react_jsx_runtime.JSX.Element;
declare const CommandInput: React.ForwardRefExoticComponent<Omit<Omit<Pick<Pick<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "key" | keyof React.InputHTMLAttributes<HTMLInputElement>> & {
    ref?: React.Ref<HTMLInputElement>;
} & {
    asChild?: boolean;
}, "asChild" | "key" | keyof React.InputHTMLAttributes<HTMLInputElement>>, "type" | "value" | "onChange"> & {
    value?: string;
    onValueChange?: (search: string) => void;
} & React.RefAttributes<HTMLInputElement>, "ref"> & {
    loading?: boolean;
} & React.RefAttributes<HTMLInputElement>>;
declare const CommandList: React.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Pick<Pick<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "asChild" | "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    label?: string;
} & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandEmpty: React.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Pick<Pick<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "asChild" | "key" | keyof React.HTMLAttributes<HTMLDivElement>> & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandGroup: React.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Omit<Pick<Pick<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "asChild" | "key" | keyof React.HTMLAttributes<HTMLDivElement>>, "heading" | "value"> & {
    heading?: React.ReactNode;
    value?: string;
    forceMount?: boolean;
} & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandSeparator: React.ForwardRefExoticComponent<Omit<Pick<Pick<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "asChild" | "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    alwaysRender?: boolean;
} & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandItem: React.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Omit<Pick<Pick<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof React.HTMLAttributes<HTMLDivElement>> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "asChild" | "key" | keyof React.HTMLAttributes<HTMLDivElement>>, "disabled" | "value" | "onSelect"> & {
    disabled?: boolean;
    onSelect?: (value: string) => void;
    value?: string;
    keywords?: string[];
    forceMount?: boolean;
} & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandShortcut: {
    ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
//# sourceMappingURL=Command.d.ts.map

declare function Counter({ duration, toValue, fromValue, delimiter, ...props }: {
    [x: string]: any;
    duration: any;
    toValue: any;
    fromValue: any;
    delimiter?: string | undefined;
}): react_jsx_runtime.JSX.Element;
//# sourceMappingURL=Counter.d.ts.map

declare const Dialog: React.FC<DialogPrimitive.DialogProps>;
declare const DialogTrigger: React.ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const DialogPortal: React.FC<DialogPrimitive.DialogPortalProps>;
declare const DialogClose: React.ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & React.RefAttributes<HTMLButtonElement>>;
declare const DialogOverlay: React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogOverlayProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const DialogContent: React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    closeButton?: React.ReactNode;
} & React.RefAttributes<HTMLDivElement>>;
declare const DialogHeader: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const DialogFooter: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const DialogTitle: React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & React.RefAttributes<HTMLHeadingElement>, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
declare const DialogDescription: React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
//# sourceMappingURL=Dialog.d.ts.map

declare const DropdownMenu: React.FC<DropdownMenuPrimitive.DropdownMenuProps>;
declare const DropdownMenuTrigger: React.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const DropdownMenuGroup: React.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuGroupProps & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuPortal: React.FC<DropdownMenuPrimitive.DropdownMenuPortalProps>;
declare const DropdownMenuSub: React.FC<DropdownMenuPrimitive.DropdownMenuSubProps>;
declare const DropdownMenuRadioGroup: React.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuRadioGroupProps & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubTrigger: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubTriggerProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubContent: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuContent: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuItem: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuItemProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuCheckboxItem: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuCheckboxItemProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuRadioItem: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuRadioItemProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuLabel: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuLabelProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSeparator: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSeparatorProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuShortcut: {
    ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
//# sourceMappingURL=DropdownMenu.d.ts.map

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
}) => react_jsx_runtime.JSX.Element;
declare const FormFieldProvider: <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ children, ...props }: React.PropsWithChildren<ControllerProps<TFieldValues, TName>>) => react_jsx_runtime.JSX.Element;
declare const FormField: <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>) => react_jsx_runtime.JSX.Element;
declare const useFormFieldState: () => FormFieldContextValue<FieldValues, string>;
declare const useFormFieldUpdater: () => React.Dispatch<React.SetStateAction<FormFieldContextValue<FieldValues, string>>>;
declare const FormItemProvider: ({ children, }: React.HTMLAttributes<HTMLDivElement>) => react_jsx_runtime.JSX.Element;
declare const FormItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const useFormField: () => {
    invalid: boolean;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
    error?: react_hook_form.FieldError;
    id: string;
    name: string;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
};
declare const FormLabel: React.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>, "ref"> & {
    tooltip?: string;
} & React.RefAttributes<HTMLLabelElement>>;
declare const FormControl: React.ForwardRefExoticComponent<Omit<_radix_ui_react_slot.SlotProps & React.RefAttributes<HTMLElement>, "ref"> & React.RefAttributes<HTMLElement>>;
declare const FormDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const FormMessage: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

declare const Label: React.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>, "ref"> & VariantProps<(props?: class_variance_authority_types.ClassProp | undefined) => string> & React.RefAttributes<HTMLLabelElement>>;
//# sourceMappingURL=Label.d.ts.map

declare function Pagination({ page, pageSize, totalItems, handleNext, handlePrev, }: {
    page: any;
    pageSize: any;
    totalItems: any;
    handleNext: any;
    handlePrev: any;
}): react_jsx_runtime.JSX.Element;

declare const Popover: React.FC<PopoverPrimitive.PopoverProps>;
declare const PopoverTrigger: React.ForwardRefExoticComponent<PopoverPrimitive.PopoverTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const PopoverAnchor: React.ForwardRefExoticComponent<PopoverPrimitive.PopoverAnchorProps & React.RefAttributes<HTMLDivElement>>;
declare const PopoverContent: React.ForwardRefExoticComponent<Omit<PopoverPrimitive.PopoverContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Popover.d.ts.map

declare const RadioGroup: React.ForwardRefExoticComponent<Omit<RadioGroupPrimitive.RadioGroupProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const RadioGroupItem: React.ForwardRefExoticComponent<Omit<RadioGroupPrimitive.RadioGroupItemProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=RadioGroup.d.ts.map

declare const SelectRoot: React.FC<SelectPrimitive.SelectProps>;
declare const SelectGroup: React.ForwardRefExoticComponent<SelectPrimitive.SelectGroupProps & React.RefAttributes<HTMLDivElement>>;
declare const SelectValue: React.ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & React.RefAttributes<HTMLSpanElement>>;
declare const SelectTrigger: React.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectTriggerProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const SelectScrollUpButton: React.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollUpButtonProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const SelectScrollDownButton: React.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollDownButtonProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const SelectContent: React.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const SelectLabel: React.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectLabelProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const SelectItem: React.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectItemProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const SelectSeparator: React.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectSeparatorProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Select.d.ts.map

declare const Select_d_SelectContent: typeof SelectContent;
declare const Select_d_SelectGroup: typeof SelectGroup;
declare const Select_d_SelectItem: typeof SelectItem;
declare const Select_d_SelectLabel: typeof SelectLabel;
declare const Select_d_SelectRoot: typeof SelectRoot;
declare const Select_d_SelectScrollDownButton: typeof SelectScrollDownButton;
declare const Select_d_SelectScrollUpButton: typeof SelectScrollUpButton;
declare const Select_d_SelectSeparator: typeof SelectSeparator;
declare const Select_d_SelectTrigger: typeof SelectTrigger;
declare const Select_d_SelectValue: typeof SelectValue;
declare namespace Select_d {
  export { Select_d_SelectContent as SelectContent, Select_d_SelectGroup as SelectGroup, Select_d_SelectItem as SelectItem, Select_d_SelectLabel as SelectLabel, Select_d_SelectRoot as SelectRoot, Select_d_SelectScrollDownButton as SelectScrollDownButton, Select_d_SelectScrollUpButton as SelectScrollUpButton, Select_d_SelectSeparator as SelectSeparator, Select_d_SelectTrigger as SelectTrigger, Select_d_SelectValue as SelectValue };
}

declare const SelectInput: ({ label, name, options, onValueChange }: {
    label: any;
    name: any;
    options: any;
    onValueChange: any;
}) => react_jsx_runtime.JSX.Element;
//# sourceMappingURL=SelectInput.d.ts.map

declare const Separator: React.ForwardRefExoticComponent<Omit<SeparatorPrimitive.SeparatorProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Separator.d.ts.map

declare const Switch: React.ForwardRefExoticComponent<Omit<SwitchPrimitives.SwitchProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=Switch.d.ts.map

declare const Table: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableElement> & React.RefAttributes<HTMLTableElement>>;
declare const TableHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableRowElement> & React.RefAttributes<HTMLTableRowElement>>;
declare const TableHead: React.ForwardRefExoticComponent<React.ThHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React.ForwardRefExoticComponent<React.TdHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCaption: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableCaptionElement> & React.RefAttributes<HTMLTableCaptionElement>>;
//# sourceMappingURL=Table.d.ts.map

declare const TabsRoot: React__default.ForwardRefExoticComponent<TabsPrimitive.TabsProps & React__default.RefAttributes<HTMLDivElement>>;
declare const TabsList: React__default.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsListProps & React__default.RefAttributes<HTMLDivElement>, "ref"> & React__default.RefAttributes<HTMLDivElement>>;
declare const TabsTrigger: React__default.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsTriggerProps & React__default.RefAttributes<HTMLButtonElement>, "ref"> & React__default.RefAttributes<HTMLButtonElement>>;
declare const TabsContent: React__default.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsContentProps & React__default.RefAttributes<HTMLDivElement>, "ref"> & React__default.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Tabs.d.ts.map

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

declare const TooltipProvider: React.FC<TooltipPrimitive.TooltipProviderProps>;
declare const TooltipRoot: React.FC<TooltipPrimitive.TooltipProps>;
declare const TooltipTrigger: React.ForwardRefExoticComponent<TooltipPrimitive.TooltipTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const TooltipContent: React.ForwardRefExoticComponent<Omit<TooltipPrimitive.TooltipContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare function Tooltip({ children, content, open, defaultOpen, onOpenChange, ...props }: TooltipPrimitive.TooltipContentProps & TooltipPrimitive.TooltipProps & {
    content?: React.ReactNode | string;
}): string | number | boolean | react_jsx_runtime.JSX.Element | Iterable<React.ReactNode> | null | undefined;
//# sourceMappingURL=Tooltip.d.ts.map

declare const ToastProvider: React.FC<ToastPrimitives.ToastProviderProps>;
declare const toastViewPortVariants: (props?: ({
    position?: "top-right" | "bottom-right" | "top-left" | "bottom-left" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const ToastViewport: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastViewportProps & React.RefAttributes<HTMLOListElement>, "ref"> & VariantProps<(props?: ({
    position?: "top-right" | "bottom-right" | "top-left" | "bottom-left" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string> & React.RefAttributes<HTMLOListElement>>;
declare const Toast$1: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastProps & React.RefAttributes<HTMLLIElement>, "ref"> & VariantProps<(props?: ({
    variant?: "default" | "destructive" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string> & React.RefAttributes<HTMLLIElement>>;
declare const ToastAction: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastActionProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const ToastClose: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastCloseProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const ToastTitle: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastTitleProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ToastDescription: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastDescriptionProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast$1>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;
//# sourceMappingURL=Toast.d.ts.map

declare function Toaster({ position, }: {
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}): react_jsx_runtime.JSX.Element;
//# sourceMappingURL=Toaster.d.ts.map

declare const Progress: React.ForwardRefExoticComponent<Omit<ProgressPrimitive.ProgressProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Progress.d.ts.map

declare enum SpinnerSize {
    sm = 6,
    md = 12,
    lg = 20
}
declare function Spinner({ size }: {
    size?: keyof typeof SpinnerSize;
}): react_jsx_runtime.JSX.Element;

declare const KpiCard: {
    ({ children, className, ...props }: {
        children: React.ReactNode;
        className?: string;
    }): react_jsx_runtime.JSX.Element;
    Header: ({ children, className, }: React.PropsWithChildren<{
        className?: string;
    }>) => react_jsx_runtime.JSX.Element;
    Title: ({ children, className, }: React.PropsWithChildren<{
        className?: string;
    }>) => react_jsx_runtime.JSX.Element;
    Content: ({ children, className, }: React.PropsWithChildren<{
        className?: string;
    }>) => react_jsx_runtime.JSX.Element;
    FooterNote: ({ children, className, }: React.PropsWithChildren<{
        className?: string;
    }>) => react_jsx_runtime.JSX.Element;
};
//# sourceMappingURL=KpiCard.d.ts.map

declare function Skeleton({ className, ...props }: React__default.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];
type CarouselProps = {
    opts?: CarouselOptions;
    orientation?: "horizontal" | "vertical";
    plugins?: CarouselPlugin;
    setApi?: (api: CarouselApi) => void;
};
declare const Carousel: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & CarouselProps & React.RefAttributes<HTMLDivElement>>;
declare const CarouselContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CarouselItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CarouselPrevious: React.ForwardRefExoticComponent<Omit<ButtonProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const CarouselNext: React.ForwardRefExoticComponent<Omit<ButtonProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=Carousel.d.ts.map

declare const Collapsible: React.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleProps & React.RefAttributes<HTMLDivElement>>;
declare const CollapsibleTrigger: React.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const CollapsibleContent: React.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleContentProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Collapsible.d.ts.map

interface CommandI {
    href: string;
    id?: string;
    result_type?: string;
    title: string;
    type?: string;
}
interface CommandMenuProps {
    commands?: CommandI[];
    fetcher?: (query: string) => Promise<CommandI[]>;
    icons?: Record<string, React.ComponentType<{
        className: string;
    }>>;
    placeholder?: string;
}
declare const CommandMenu: ({ commands, fetcher, icons, placeholder, usePopover, enableGlobalShortcut, openInNewTab, ...props }: CommandMenuProps & ButtonProps & {
    enableGlobalShortcut?: boolean;
    openInNewTab?: boolean;
    usePopover?: boolean;
}) => react_jsx_runtime.JSX.Element;

declare function ClickToCopy({ text, className, children, }: PropsWithChildren<{
    className?: string;
    text: string;
}>): react_jsx_runtime.JSX.Element;

declare const TaggablePopover: ({ tags, selectedTags, onSelect }: {
    tags: any;
    selectedTags: any;
    onSelect: any;
}) => react_jsx_runtime.JSX.Element;

type Theme = "dark" | "light" | "system";
type ThemeProviderProps = {
    children: React__default.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};
type ThemeProviderState = {
    setTheme: (theme: Theme) => void;
    theme: Theme;
};
declare function ThemeProvider({ children, defaultTheme, storageKey, ...props }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
declare const useTheme: () => ThemeProviderState;

declare function ModeToggle(): react_jsx_runtime.JSX.Element;

declare function DataTableColumnHeader({ column, title, className }: {
    column: any;
    title: any;
    className: any;
}): react_jsx_runtime.JSX.Element;

declare function DataTableFacetedFilter({ column, title, options }: {
    column: any;
    title: any;
    options: any;
}): react_jsx_runtime.JSX.Element;

declare function DataTablePagination({ itemsPerPageOptions, }: {
    itemsPerPageOptions?: number[] | undefined;
}): react_jsx_runtime.JSX.Element;

declare const DataTableRowActions: ({ row, column }: {
    row: any;
    column: any;
}) => react_jsx_runtime.JSX.Element | null;

declare function DataTableToolbar({ action, showViewOptions, searchKey, }: {
    action: any;
    showViewOptions?: boolean | undefined;
    searchKey?: string | undefined;
}): react_jsx_runtime.JSX.Element;

declare function DataTableViewOptions(): react_jsx_runtime.JSX.Element;

declare const DynamicActionComponent: ({ action, row }: {
    action: any;
    row: any;
}) => react_jsx_runtime.JSX.Element | null;
interface ActionFormProps {
    action: {
        method: string;
        name: string;
        trigger_confirmation: boolean;
        url_path: string;
    };
    children?: React__default.ReactNode;
    row: {
        original: {
            id: string;
        };
    };
}
declare const ActionForm: React__default.FC<ActionFormProps>;

declare function DataTableHeader(): react_jsx_runtime.JSX.Element;

declare function DataTableBody({ hasDetails }: {
    hasDetails: any;
}): react_jsx_runtime.JSX.Element;

declare const formatParamsToDataTable: (params: any, searchKey: any) => {
    columnFilters: {
        id: string;
        value: unknown;
    }[];
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting: any[];
} | {
    columnFilters?: undefined;
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting: any[];
} | {
    columnFilters: {
        id: string;
        value: unknown;
    }[];
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting?: undefined;
} | {
    columnFilters?: undefined;
    pagination: {
        pageIndex: any;
        pageSize: any;
    };
    sorting?: undefined;
};
declare const renderDataTableCell: ({ filters, column, row, selectedRows }: {
    filters: any;
    column: any;
    row: any;
    selectedRows: any;
}) => any;
declare const defaultDataTableFilterFn: (row: any, id: any, filterValue: any) => any;
declare const buildDataTableColumns: (columnsConfig: any, filters: any, selectedRows: any) => any;
declare function SWRDataTable({ fetchPath, searchKey, defaultParams, hasDetails, action, setSelectedData, selectedRows, }: {
    action?: React__default.ReactNode;
    defaultParams?: Record<string, unknown>;
    fetchPath: string;
    hasDetails?: boolean;
    searchKey?: string;
    selectedRows?: any[];
    setSelectedData?: (data: any[]) => void;
}): react_jsx_runtime.JSX.Element;

declare const TableContext: React__default.Context<{}>;
declare function useTableContext(): {};

declare function useSWRDataTable(path: any, initialSearch?: {}, options?: {}): {
    data: any;
    error: any;
    isLoading: boolean;
    tableState: {
        pagination: _tanstack_table_core.PaginationState;
        rowSelection: _tanstack_table_core.RowSelectionState;
        columnVisibility: _tanstack_table_core.VisibilityState;
        columnFilters: _tanstack_table_core.ColumnFiltersState;
        sorting: _tanstack_table_core.SortingState;
        grouping: _tanstack_table_core.GroupingState;
        expanded: boolean | Record<string, boolean>;
    };
    setTableState: {
        setPagination: React.Dispatch<React.SetStateAction<_tanstack_table_core.PaginationState>>;
        setRowSelection: React.Dispatch<React.SetStateAction<_tanstack_table_core.RowSelectionState>>;
        setColumnVisibility: React.Dispatch<React.SetStateAction<_tanstack_table_core.VisibilityState>>;
        setColumnFilters: React.Dispatch<React.SetStateAction<_tanstack_table_core.ColumnFiltersState>>;
        setSorting: React.Dispatch<React.SetStateAction<_tanstack_table_core.SortingState>>;
        setGrouping: React.Dispatch<React.SetStateAction<_tanstack_table_core.GroupingState>>;
        setExpanded: React.Dispatch<React.SetStateAction<boolean | Record<string, boolean>>>;
    };
};

declare function useTableState(initialState?: TableOptions<unknown[]>["state"]): {
    tableState: {
        pagination: _tanstack_react_table.PaginationState;
        rowSelection: _tanstack_react_table.RowSelectionState;
        columnVisibility: _tanstack_react_table.VisibilityState;
        columnFilters: _tanstack_react_table.ColumnFiltersState;
        sorting: _tanstack_react_table.SortingState;
        grouping: _tanstack_react_table.GroupingState;
        expanded: boolean | Record<string, boolean>;
    };
    setTableState: {
        setPagination: React.Dispatch<React.SetStateAction<_tanstack_react_table.PaginationState>>;
        setRowSelection: React.Dispatch<React.SetStateAction<_tanstack_react_table.RowSelectionState>>;
        setColumnVisibility: React.Dispatch<React.SetStateAction<_tanstack_react_table.VisibilityState>>;
        setColumnFilters: React.Dispatch<React.SetStateAction<_tanstack_react_table.ColumnFiltersState>>;
        setSorting: React.Dispatch<React.SetStateAction<_tanstack_react_table.SortingState>>;
        setGrouping: React.Dispatch<React.SetStateAction<_tanstack_react_table.GroupingState>>;
        setExpanded: React.Dispatch<React.SetStateAction<boolean | Record<string, boolean>>>;
    };
};

declare function formatRequestParams(originalObj: any): any;
declare function DataTable({ children, data, error, tableState, setTableState, buildTableColumns, setQueryToParams, setSelectedData, isLoading, }: {
    children: any;
    data: any;
    error: any;
    tableState: any;
    setTableState: any;
    buildTableColumns?: ((columnsConfig: any) => any) | undefined;
    setQueryToParams: any;
    setSelectedData: any;
    isLoading?: boolean | undefined;
}): react_jsx_runtime.JSX.Element;

declare function DataTableSearch({ searchKey, placeholder }: {
    searchKey?: string | undefined;
    placeholder?: string | undefined;
}): react_jsx_runtime.JSX.Element;

declare function DataTableFilters(): react_jsx_runtime.JSX.Element | null;

interface Conditions {
    [key: string]: any;
    allOf?: Conditions[];
    anyOf?: Conditions[];
}

interface CheckboxFieldProps extends BaseField {
    type: "checkbox";
}
declare const CheckboxField: (props: CommonFieldProps<CheckboxFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface DatePickerInputProps extends BaseField {
    type: "date" | "datetime";
}
declare const DatePickerInput: (props: CommonFieldProps<DatePickerInputProps>) => react_jsx_runtime.JSX.Element | null;

interface FileUploadFieldProps extends BaseField {
    accept?: string;
    download?: boolean;
    mode: "image" | "file";
    style?: {
        size?: "small" | "medium" | "large";
    };
    type: "file";
}
declare const FileUploadField: (props: CommonFieldProps<FileUploadFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface InputFieldProps extends BaseField {
    length?: {
        maximum?: number;
        minimum: number;
    };
    mode: "text" | "number";
    type: "input";
}
declare const InputField: (props: CommonFieldProps<InputFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface RadioGroupFieldProps extends BaseField {
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
declare const RadioGroupField: (props: CommonFieldProps<RadioGroupFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface RichTextEditorFieldProps extends BaseField {
    type: "wysiwyg";
}

interface SelectFieldProps extends BaseField {
    options?: Array<{
        label: string;
        tooltip?: string;
        value: string;
    }>;
}
declare const SelectField: (props: CommonFieldProps<SelectFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface TextAreaFieldProps extends BaseField {
    length?: {
        maximum?: number;
        minimum: number;
    };
    type: "textarea";
}
declare const TextAreaField: (props: CommonFieldProps<TextAreaFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface FieldArrayFieldProps extends BaseField {
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
declare const FieldArray: (props: CommonFieldProps<FieldArrayFieldProps>) => react_jsx_runtime.JSX.Element | null;

declare function buildForm(fields: CommonFieldProps<BaseField>["field"][], form: CommonFieldProps<BaseField>["form"], index?: number, customComponents?: {
    [key: string]: FieldComponentType;
}): react_jsx_runtime.JSX.Element[];
declare const parseFields: (fields: any, index: any) => any;

type FieldComponentType = (props: CommonFieldProps<BaseField>) => React__default.ReactNode | null;
interface CommonFieldProps<T extends BaseField> {
    buildForm?: typeof buildForm;
    customComponents?: {
        [key: string]: FieldComponentType;
    };
    field: T;
    form: UseFormReturn<FieldValues>;
}
interface BaseField {
    component?: React__default.ComponentType<CommonFieldProps<BaseField>>;
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
type FormFieldProps = InputFieldProps | TextAreaFieldProps | CheckboxFieldProps | DatePickerInputProps | FileUploadFieldProps | SelectFieldProps | RadioGroupFieldProps | RichTextEditorFieldProps | FieldArrayFieldProps;

interface DelegateFieldProps extends BaseField {
    delegateKey: string;
    options: Array<{
        delegateValue: string;
        value: string;
    }>;
}
declare const DelegateField: (props: CommonFieldProps<DelegateFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface RadiusOption {
    classes: string;
    label: string;
    value: string;
}
interface RadiusSelectFieldProps extends BaseField {
    options: RadiusOption[];
}
declare const RadiusSelect: (props: CommonFieldProps<RadiusSelectFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface ColorPickerFieldProps extends SelectFieldProps {
    color_content_key?: string;
    set_content?: boolean;
    style?: {
        size?: "small" | "full";
    };
}
declare const ColorPickerField: (props: CommonFieldProps<ColorPickerFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface MultiSelectCheckboxesFieldProps extends SelectFieldProps {
    type: "multi_select_checkbox";
}
declare const MultiSelectCheckboxes: (props: CommonFieldProps<MultiSelectCheckboxesFieldProps>) => react_jsx_runtime.JSX.Element | null;

interface MultiSelectField extends SelectFieldProps {
    type: "multi_select";
}
declare const MultiSelect: (props: CommonFieldProps<MultiSelectField>) => react_jsx_runtime.JSX.Element | null;

interface SwitchFieldProps extends BaseField {
    type: "switch";
}
declare const SwitchField: (props: CommonFieldProps<SwitchFieldProps>) => react_jsx_runtime.JSX.Element | null;

declare const fieldComponents: {
    readonly input: (props: CommonFieldProps<InputFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly checkbox: (props: CommonFieldProps<CheckboxFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly radio_item: (props: CommonFieldProps<RadioGroupFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly textarea: (props: CommonFieldProps<TextAreaFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly date: (props: CommonFieldProps<DatePickerInputProps>) => react_jsx_runtime.JSX.Element | null;
    readonly datetime: (props: CommonFieldProps<DatePickerInputProps>) => react_jsx_runtime.JSX.Element | null;
    readonly file: (props: CommonFieldProps<FileUploadFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly switch: (props: CommonFieldProps<SwitchFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly select: (props: CommonFieldProps<SelectFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly multi_select: (props: CommonFieldProps<MultiSelectField>) => react_jsx_runtime.JSX.Element | null;
    readonly field_array: (props: CommonFieldProps<FieldArrayFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly hidden: (props: CommonFieldProps<BaseField>) => react_jsx_runtime.JSX.Element | null;
    readonly wysiwyg: (props: CommonFieldProps<RichTextEditorFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly multi_select_checkbox: (props: CommonFieldProps<MultiSelectCheckboxesFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly color_picker: (props: CommonFieldProps<ColorPickerFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly searchable_select: (props: CommonFieldProps<SelectFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly radius_select: (props: CommonFieldProps<RadiusSelectFieldProps>) => react_jsx_runtime.JSX.Element | null;
    readonly delegate: (props: CommonFieldProps<DelegateFieldProps>) => react_jsx_runtime.JSX.Element | null;
};

declare const SearchableSelectField: (props: CommonFieldProps<SelectFieldProps>) => react_jsx_runtime.JSX.Element | null;

declare const HiddenField: (props: CommonFieldProps<BaseField>) => react_jsx_runtime.JSX.Element | null;

declare function withConditional<T extends BaseField>(Component: React__default.ComponentType<CommonFieldProps<T>>): (props: CommonFieldProps<T>) => react_jsx_runtime.JSX.Element | null;

declare function loadCSRFFromMetaTag(): string;
interface RailsAppContextProps {
    csrfToken: string;
}
declare const RailsAppContext: React__default.Context<RailsAppContextProps>;
declare const RailsAppProvider: ({ children, csrfToken, }: PropsWithChildren<{
    csrfToken?: string;
}>) => react_jsx_runtime.JSX.Element;
declare const useRailsApp: () => RailsAppContextProps;

type SectionTitleProps = {
    children: React__default.ReactNode;
    className?: string;
};
declare const SectionTitle: React__default.FC<SectionTitleProps>;

interface OTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "ref" | "value" | "onFocus" | "onBlur" | "onKeyDown" | "onPaste" | "autoComplete" | "maxLength"> {
    /** Number of OTP inputs to be rendered */
    numInputs?: number;
    /** Callback to be called when the OTP value changes */
    onOtpChange?: (otp: string) => void;
    /** Value of the OTP input */
    value?: string;
}
declare const OtpInput: ({ value, numInputs, onOtpChange, type, placeholder, pattern, autoFocus, className, id, name, ...rest }: OTPInputProps) => react_jsx_runtime.JSX.Element;

interface SubmitButtonProps extends ButtonProps {
    isSubmitting?: boolean;
    submittingText?: string;
}
declare const SubmitButton: React__default.ForwardRefExoticComponent<SubmitButtonProps & React__default.RefAttributes<HTMLButtonElement>>;

declare const StrictModeDroppable: ({ children, ...props }: DroppableProps) => react_jsx_runtime.JSX.Element | null;

declare function CardSkeleton({ className }: {
    className?: string | undefined;
}): react_jsx_runtime.JSX.Element;

declare function ChartSkeleton({ barsSetCount, className }: {
    barsSetCount?: number | undefined;
    className?: string | undefined;
}): react_jsx_runtime.JSX.Element;

declare function KpiSkeleton(): react_jsx_runtime.JSX.Element;

declare function TableSkeleton({ rowsCount, columnsCount, className, }: {
    rowsCount?: number | undefined;
    columnsCount?: number | undefined;
    className?: string | undefined;
}): react_jsx_runtime.JSX.Element;

type DebounceOptions = {
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
};
type ControlFunctions = {
    cancel: () => void;
    flush: () => void;
    isPending: () => boolean;
};
type DebouncedState<T extends (...args: any) => ReturnType<T>> = ((...args: Parameters<T>) => ReturnType<T> | undefined) & ControlFunctions;
declare function useDebounceCallback<T extends (...args: any) => ReturnType<T>>(func: T, delay?: number, options?: DebounceOptions): DebouncedState<T>;

type UseDebounceValueOptions<T> = {
    equalityFn?: (left: T, right: T) => boolean;
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
};
declare function useDebounceValue<T>(initialValue: T | (() => T), delay: number, options?: UseDebounceValueOptions<T>): [T, DebouncedState<(value: T) => void>];

type ToasterToast = ToastProps & {
    action?: ToastActionElement;
    description?: React.ReactNode;
    id: string;
    title?: React.ReactNode;
};
declare const actionTypes: {
    readonly ADD_TOAST: "ADD_TOAST";
    readonly UPDATE_TOAST: "UPDATE_TOAST";
    readonly DISMISS_TOAST: "DISMISS_TOAST";
    readonly REMOVE_TOAST: "REMOVE_TOAST";
};
type ActionType = typeof actionTypes;
type Action = {
    toast: ToasterToast;
    type: ActionType["ADD_TOAST"];
} | {
    toast: Partial<ToasterToast>;
    type: ActionType["UPDATE_TOAST"];
} | {
    toastId?: ToasterToast["id"];
    type: ActionType["DISMISS_TOAST"];
} | {
    toastId?: ToasterToast["id"];
    type: ActionType["REMOVE_TOAST"];
};
interface State {
    toasts: ToasterToast[];
}
declare const reducer: (state: State, action: Action) => State;
type Toast = Omit<ToasterToast, "id">;
declare function toast({ ...props }: Toast): {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
};
declare function useToast(): {
    toast: typeof toast;
    dismiss: (toastId?: string) => void;
    toasts: ToasterToast[];
};

declare function useUnmount(func: () => void): void;

declare const cn: (...inputs: ClassValue[]) => string;

declare function capitalize(word: string): string;
declare function camelToSnake(str: string): string;

declare function formatDate(date: any, language?: string): string;
declare function formatDateTime(date: Date | string | number, language?: string): string;
declare function formatDateToLocalDatetime(date: Date): string;
declare const epochToDate: (epoch: number) => Date;

type Notation = "compact" | "engineering" | "scientific" | "standard";
type NumberStyle = "decimal" | "currency" | "percent" | "unit";
declare const formatNumber: (number: number | string | bigint, decimals?: number, numberStyle?: NumberStyle, notation?: Notation, lessThanThresholdToReplace?: number, language?: string) => string;
declare function numberToPercent(value?: number): number | undefined;
declare function percentToNumber(value: number): number;
declare function convertStringToNumberAndRoundDown(value: string): number | bigint;

type GetDeepProp<T extends object, K extends string> = K extends keyof T ? T[K] : {
    [P in keyof T]: GetDeepProp<Extract<T[P], object>, K>;
}[keyof T];
type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Serializes an object into a query string. This function handles nested objects, arrays,
 * and primitive data types (strings, numbers, booleans). It encodes keys and values to
 * ensure a valid query string. The function throws an error if the input is not an object.
 *
 * @example
 * // Basic usage
 * const params = { name: 'John', age: 30 };
 * serializeQuery(params);
 * > 'name=John&age=30'
 *
 * @example
 * // Nested objects and arrays
 * const complexParams = {
 *   user: { name: 'John', roles: ['admin', 'user'] },
 *   active: true
 * };
 * serializeQuery(complexParams);
 * > 'user[name]=John&user[roles][]=admin&user[roles][]=user&active=true'
 *
 * @param {Object} params - The object to be serialized into a query string.
 * @param {string} [prefix=""] - A prefix used for nested objects (internal use).
 * @returns {string} - The serialized query string.
 * @throws {Error} - Throws an error if the input is not an object.
 */
declare function serializeQuery(params?: object | null, prefix?: string): string;
/**
 * Deserializes a query string into an object. This function can handle nested parameters
 * and arrays. It uses URLSearchParams to parse the query string and reconstructs the
 * original object structure. The function throws an error if the input is not a string.
 *
 * @example
 * const queryString = 'user[name]=John&user[roles][]=admin&user[roles][]=user&active=true';
 * deserializeQuery(queryString);
 * > { user: { name: 'John', roles: ['admin', 'user'] }, active: 'true' }
 *
 * @param {string} queryString - The query string to be deserialized into an object.
 * @returns {Object} - The deserialized object.
 * @throws {Error} - Throws an error if the input is not a string.
 */
declare function deserializeQuery(queryString: string | null): object;

declare const defaultNS: "translation";
declare const resources: {
    readonly en: {
        readonly translation: {};
    };
    readonly "pt-BR": {
        readonly translation: {
            "Search results": string;
            Loading: string;
            "No results found": string;
            "Type a command or search": string;
            "Global search": string;
            "Copied to clipboard": string;
            "Clear filters": string;
            Reset: string;
            "Items per page": string;
            "Page {{currentPage}} of": string;
            Search: string;
            View: string;
            "Toggle columns": string;
            "Are you sure?": string;
            "This action cannot be undone.": string;
            Cancel: string;
            Confirm: string;
            Open: string;
            "Something went wrong!": string;
            "Pick a date": string;
            "Click to Upload": string;
            "Upload a file": string;
            Download: string;
            "Start writing": string;
            "Toggle theme": string;
            Light: string;
            Dark: string;
            Beta: string;
        };
    };
};

declare const i18n_d_defaultNS: typeof defaultNS;
declare const i18n_d_resources: typeof resources;
declare namespace i18n_d {
  export { i18n as default, i18n_d_defaultNS as defaultNS, i18n_d_resources as resources };
}

export { ActionForm, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, type ArrElement, Avatar, AvatarFallback, AvatarImage, Badge, type BadgeProps, type BaseField, Button, type ButtonProps, Calendar, Card, CardContent, CardDescription, CardFooter, CardHeader, CardSkeleton, CardTitle, Carousel, type CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, ChartSkeleton, Checkbox, CheckboxField, type CheckboxFieldProps, ClickToCopy, Collapsible, CollapsibleContent, CollapsibleTrigger, ColorPickerField, type ColorPickerFieldProps, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandMenu, CommandSeparator, CommandShortcut, type CommonFieldProps, Counter, DataTable, DataTableBody, DataTableColumnHeader, DataTableFacetedFilter, DataTableFilters, DataTableHeader, DataTablePagination, DataTableRowActions, DataTableSearch, DataTableToolbar, DataTableViewOptions, DatePickerInput, type DatePickerInputProps, type DebouncedState, DelegateField, type DelegateFieldProps, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DynamicActionComponent, FieldArray, type FieldArrayFieldProps, type FieldComponentType, FileUploadField, type FileUploadFieldProps, Form, FormControl, FormDescription, FormField, type FormFieldProps, FormFieldProvider, FormItem, FormItemProvider, FormLabel, FormMessage, type GetDeepProp, HiddenField, Input, InputField, type InputFieldProps, type InputProps, KpiCard, KpiSkeleton, Label, ModeToggle, MultiSelect, MultiSelectCheckboxes, type MultiSelectCheckboxesFieldProps, type MultiSelectField, OtpInput, Pagination, Popover, PopoverAnchor, PopoverContent, PopoverTrigger, Progress, RadioGroup, RadioGroupField, type RadioGroupFieldProps, RadioGroupItem, type RadiusOption, RadiusSelect, type RadiusSelectFieldProps, RailsAppContext, RailsAppProvider, SWRDataTable, SearchableSelectField, SectionTitle, Select_d as Select, SelectField, type SelectFieldProps, SelectInput, Separator, Skeleton, Spinner, StrictModeDroppable, SubmitButton, type SubmitButtonProps, Switch, SwitchField, type SwitchFieldProps, Table, TableBody, TableCaption, TableCell, TableContext, TableFooter, TableHead, TableHeader, TableRow, TableSkeleton, TabsContent, TabsList, TabsRoot, TabsTrigger, TaggablePopover, TextAreaField, type TextAreaFieldProps, Textarea, type TextareaProps, ThemeProvider, Toast$1 as Toast, ToastAction, type ToastActionElement, ToastClose, ToastDescription, type ToastProps, ToastProvider, ToastTitle, ToastViewport, Toaster, Tooltip, TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger, badgeVariants, buildDataTableColumns, buildForm, buttonVariants, camelToSnake, capitalize, cn, convertStringToNumberAndRoundDown, defaultDataTableFilterFn, deserializeQuery, epochToDate, fieldComponents, formatDate, formatDateTime, formatDateToLocalDatetime, formatNumber, formatParamsToDataTable, formatRequestParams, i18n_d as i18n, loadCSRFFromMetaTag, numberToPercent, parseFields, percentToNumber, reducer, renderDataTableCell, serializeQuery, toast, toastViewPortVariants, useDebounceCallback, useDebounceValue, useFormField, useFormFieldState, useFormFieldUpdater, useRailsApp, useSWRDataTable, useTableContext, useTableState, useTheme, useToast, useUnmount, withConditional };
