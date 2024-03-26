"use client";

import {
  Button,
  Dialog as DialogPrimitive,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@bleu-fi/ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import cn from "clsx";
import * as React from "react";

export function Dialog({
  children,
  content,
  title,
  onClose,
  submitText,
  onSubmit,
  disableSubmit = false,
}: React.PropsWithChildren<{
  content: React.ReactElement;
  submitText: string;
  onSubmit: () => void;
  title?: string;
  onClose?: (event: Event) => void;
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
            "data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-darkBrown focus:outline-none bg-input text-background w-[90vw] max-w-[450px] p-[25px]"
          )}
          onCloseAutoFocus={onClose}
        >
          <DialogTitle className="text-2xl font-medium text-background">
            {title}
          </DialogTitle>
          <div className="mt-2 w-full">
            {React.cloneElement(React.Children.only(content), {
              close: () => setOpen(false),
            })}
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
          <DialogClose asChild>
            <button
              className="absolute right-[10px] top-[10px] inline-flex size-[30px] items-center justify-center text-sand12 hover:font-black focus:outline-none"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogPrimitive>
  );
}
