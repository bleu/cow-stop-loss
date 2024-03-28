"use client";

import {
  Button,
  Dialog as DialogPrimitive,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@bleu-fi/ui";
import cn from "clsx";
import * as React from "react";

export function Dialog({
  children,
  content,
  title,
  submitText,
  onSubmit,
  disableSubmit = false,
}: React.PropsWithChildren<{
  content: React.ReactElement;
  submitText: string;
  onSubmit: () => void;
  title?: string;
  disableSubmit?: boolean;
}>) {
  const [open, setOpen] = React.useState(false);
  return (
    <DialogPrimitive open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogPortal>
        <DialogOverlay
          id="dialog-overlay"
          className={cn(
            "bg-black/20 data-[state=open]:animate-overlayShow fixed inset-0"
          )}
        />
        <DialogContent
          className={cn(
            "data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-[6px] focus:outline-none bg-foreground text-background w-[90vw] max-w-[450px] p-[25px]"
          )}
        >
          <div className="flex flex-col justify-between w-full">
            <DialogTitle className="text-2xl font-medium text-background">
              {title}
            </DialogTitle>
          </div>
          <div className="mt-2 w-full">
            {content}
            <Button
              className="w-full mt-4"
              disabled={disableSubmit}
              onClick={() => {
                onSubmit?.();
                setOpen(false);
              }}
            >
              {submitText}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogPrimitive>
  );
}