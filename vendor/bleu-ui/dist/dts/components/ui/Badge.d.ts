import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { PropsWithChildren } from "react";
declare const badgeVariants: (props?: ({
    color?: "destructive" | "secondary" | "primary" | "success" | "pending" | null | undefined;
    outline?: "none" | "outline" | null | undefined;
    size?: "sm" | "lg" | "xs" | "md" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface BadgeProps extends React.PropsWithChildren<VariantProps<typeof badgeVariants> & {
    className?: string;
}> {
}
declare const Badge: ({ className, color, outline, size, ...props }: PropsWithChildren<BadgeProps>) => import("react/jsx-runtime").JSX.Element;
export { Badge, badgeVariants };
//# sourceMappingURL=Badge.d.ts.map