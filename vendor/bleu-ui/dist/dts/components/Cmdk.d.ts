import * as React from "react";
import { ButtonProps } from "./ui";
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
declare const useDebounce: (value: any, delay: any) => any;
export default useDebounce;
export declare const CommandMenu: ({ commands, fetcher, icons, placeholder, usePopover, enableGlobalShortcut, openInNewTab, ...props }: CommandMenuProps & ButtonProps & {
    enableGlobalShortcut?: boolean;
    openInNewTab?: boolean;
    usePopover?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Cmdk.d.ts.map