import React from "react";
import { ButtonProps } from "./ui/Button";
export interface SubmitButtonProps extends ButtonProps {
    isSubmitting?: boolean;
    submittingText?: string;
}
export declare const SubmitButton: React.ForwardRefExoticComponent<SubmitButtonProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=SubmitButton.d.ts.map