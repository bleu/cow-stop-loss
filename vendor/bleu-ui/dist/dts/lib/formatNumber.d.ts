type Notation = "compact" | "engineering" | "scientific" | "standard";
type NumberStyle = "decimal" | "currency" | "percent" | "unit";
export declare const formatNumber: (number: number | string | bigint, decimals?: number, numberStyle?: NumberStyle, notation?: Notation, lessThanThresholdToReplace?: number, language?: string) => string;
export declare function numberToPercent(value?: number): number | undefined;
export declare function percentToNumber(value: number): number;
export declare function convertStringToNumberAndRoundDown(value: string): number | bigint;
export {};
//# sourceMappingURL=formatNumber.d.ts.map