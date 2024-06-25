import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";

type FormProps<T extends FieldValues> = {
  onSubmit: (data: T) => void;
  id?: string;
  className?: string;
} & UseFormReturn<T>;

export const Form = <T extends FieldValues>({
  children,
  onSubmit: onFormSubmit,
  className,
  id,
  ...formMethods
}: React.PropsWithChildren<FormProps<T>>) => {
  const onSubmit = formMethods.handleSubmit(onFormSubmit);
  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          onSubmit(e);
        }}
        {...((id && { id }) || {})}
        className={className}
      >
        {children}
      </form>
    </FormProvider>
  );
};
