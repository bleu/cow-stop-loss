import React, { PropsWithChildren } from "react";
export declare function loadCSRFFromMetaTag(): string;
interface RailsAppContextProps {
    csrfToken: string;
}
export declare const RailsAppContext: React.Context<RailsAppContextProps>;
export declare const RailsAppProvider: ({ children, csrfToken, }: PropsWithChildren<{
    csrfToken?: string;
}>) => import("react/jsx-runtime").JSX.Element;
export declare const useRailsApp: () => RailsAppContextProps;
export {};
//# sourceMappingURL=context.d.ts.map