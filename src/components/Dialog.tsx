import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@bleu-fi/ui";

export function Dialog({
  children,
  content,
  defaultOpen = false,
}: React.PropsWithChildren<{
  content: React.ReactElement;
  defaultOpen?: boolean;
}>) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[550px]">
        {content}
      </AlertDialogContent>
    </AlertDialog>
  );
}
