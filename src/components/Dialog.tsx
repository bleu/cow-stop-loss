"use client";

import {
  Dialog as DialogPrimitive,
  DialogContent,
  DialogTrigger,
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
    <DialogPrimitive defaultOpen={defaultOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">{content}</DialogContent>
    </DialogPrimitive>
  );
}
