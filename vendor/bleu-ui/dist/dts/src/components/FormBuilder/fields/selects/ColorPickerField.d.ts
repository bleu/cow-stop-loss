import { SelectFieldProps } from "./SelectField";
export interface ColorPickerFieldProps extends SelectFieldProps {
    color_content_key?: string;
    set_content?: boolean;
    style?: {
        size?: "small" | "full";
    };
}
export declare const ColorPickerField: (props: import("../..").CommonFieldProps<ColorPickerFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=ColorPickerField.d.ts.map