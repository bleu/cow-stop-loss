"use client";

import { Button, Popover, PopoverContent, PopoverTrigger } from "@bleu/ui";
import { useEffect, useRef, useState } from "react";

import { PixelIcon } from "./ui/pixel-icon";

export function PublicTestingNotice() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);

  function cancelClose() {
    clearTimeout(closeTimer.current);
  }

  function show() {
    cancelClose();
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      const focused = document.activeElement;
      if (focused === trigger.current || content.current?.contains(focused))
        return;
      setOpen(false);
    }, 150);
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={trigger}
          type="button"
          variant="outline"
          size="icon"
          aria-label="Public testing warning"
          className="pixel-control rescue-header-control size-11 bg-card text-warning"
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") show();
          }}
          onPointerLeave={scheduleClose}
          onFocus={show}
          onBlur={scheduleClose}
          onKeyDown={(event) => {
            if (open && event.key === "Tab" && !event.shiftKey) {
              event.preventDefault();
              content.current?.querySelector("a")?.focus();
            }
          }}
          onClick={(event) => {
            event.preventDefault();
            show();
          }}
        >
          <PixelIcon name="warning" className="size-5 text-warning" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={content}
        aria-label="Public testing"
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={14}
        className="pixel-frame w-72 max-w-[calc(100vw-28px)] rounded-none p-3 text-xs text-popover-foreground"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        onFocus={cancelClose}
        onBlur={scheduleClose}
        onKeyDown={(event) => {
          if (event.key === "Tab" && event.shiftKey) {
            event.preventDefault();
            trigger.current?.focus();
          }
        }}
      >
        <p role="note">
          Public testing. Funds are at risk. $10,000 max per order. Report
          problems on{" "}
          <a
            href="https://github.com/bleu/cow-stop-loss/issues/new"
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            GitHub issues
          </a>
          .
        </p>
      </PopoverContent>
    </Popover>
  );
}
