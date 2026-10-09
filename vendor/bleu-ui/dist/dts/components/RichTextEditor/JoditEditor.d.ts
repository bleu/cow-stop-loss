import React from "react";
import "jodit/es5/jodit.min.css";
import { Jodit } from "jodit/es2018/jodit.fat.min";
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
interface JoditEditorProps {
    className?: string;
    config?: DeepPartial<Jodit["options"]>;
    editorRef?: (editor: Jodit) => void;
    id?: string;
    name?: string;
    onBlur?: (newValue: string) => void;
    onChange?: (newValue: string) => void;
    tabIndex?: number;
    value: string;
}
declare const JoditEditor: React.MemoExoticComponent<React.ForwardRefExoticComponent<JoditEditorProps & React.RefAttributes<HTMLTextAreaElement>>>;
export default JoditEditor;
//# sourceMappingURL=JoditEditor.d.ts.map