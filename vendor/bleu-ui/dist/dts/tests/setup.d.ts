import * as matchers from "@testing-library/jest-dom/matchers";
declare module "vitest" {
    interface Assertion<T = any> extends jest.Matchers<void, T>, matchers.TestingLibraryMatchers<T, void> {
    }
}
export declare const renderHookWithError: (...args: unknown[]) => never;
//# sourceMappingURL=setup.d.ts.map