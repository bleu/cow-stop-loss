declare const useFormMock: () => {
    watch: import("vitest").Mock<any, any>;
    setValue: import("vitest").Mock<any, any>;
    getValues: import("vitest").Mock<any, any>;
    handleSubmit: import("vitest").Mock<any, any>;
    reset: import("vitest").Mock<any, any>;
    formState: {
        errors: {};
    };
};
export default useFormMock;
//# sourceMappingURL=useFormMock.d.ts.map