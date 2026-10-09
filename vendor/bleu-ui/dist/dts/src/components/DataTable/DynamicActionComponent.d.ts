import React from "react";
export declare const DynamicActionComponent: ({ action, row }: {
    action: any;
    row: any;
}) => import("react/jsx-runtime").JSX.Element | null;
interface ActionFormProps {
    action: {
        method: string;
        name: string;
        trigger_confirmation: boolean;
        url_path: string;
    };
    children?: React.ReactNode;
    row: {
        original: {
            id: string;
        };
    };
}
export declare const ActionForm: React.FC<ActionFormProps>;
export {};
//# sourceMappingURL=DynamicActionComponent.d.ts.map