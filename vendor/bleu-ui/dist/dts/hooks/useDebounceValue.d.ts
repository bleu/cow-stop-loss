import type { DebouncedState } from "./useDebounceCallback";
type UseDebounceValueOptions<T> = {
    equalityFn?: (left: T, right: T) => boolean;
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
};
export declare function useDebounceValue<T>(initialValue: T | (() => T), delay: number, options?: UseDebounceValueOptions<T>): [T, DebouncedState<(value: T) => void>];
export {};
//# sourceMappingURL=useDebounceValue.d.ts.map