import { BaseField } from "../types";
export interface FileUploadFieldProps extends BaseField {
    accept?: string;
    download?: boolean;
    mode: "image" | "file";
    style?: {
        size?: "small" | "medium" | "large";
    };
    type: "file";
}
export declare const FileUploadField: (props: import("../types").CommonFieldProps<FileUploadFieldProps>) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FileUploadField.d.ts.map