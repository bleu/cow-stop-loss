import * as React from "react";
interface OTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "ref" | "value" | "onFocus" | "onBlur" | "onKeyDown" | "onPaste" | "autoComplete" | "maxLength"> {
    /** Number of OTP inputs to be rendered */
    numInputs?: number;
    /** Callback to be called when the OTP value changes */
    onOtpChange?: (otp: string) => void;
    /** Value of the OTP input */
    value?: string;
}
export declare const OtpInput: ({ value, numInputs, onOtpChange, type, placeholder, pattern, autoFocus, className, id, name, ...rest }: OTPInputProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=OtpInput.d.ts.map