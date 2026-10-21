"use client";

import {
  Toast,
  toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToast,
} from "@bleu/ui";
import Link from "next/link";

import { PixelIcon } from "#/components/ui/pixel-icon";
import type { ChainId } from "#/lib/publicClients";
import { isRejected } from "#/lib/stopLossPlacement";

const shown = new Set<string>();

export function OrderToaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const failed = variant === "destructive";
        const iconName = failed ? "warning" : "check-circle";
        return (
          <Toast
            key={id}
            {...props}
            className="pixel-frame items-start justify-start gap-3 space-x-0 rounded-none border-border/70 bg-card p-4 pr-14 text-card-foreground shadow-[0_8px_32px_-8px_hsl(217_72%_6%/0.4)] transition-[opacity,transform] motion-reduce:animate-none motion-reduce:transition-none"
          >
            <div
              className={`pixel-inset flex size-9 shrink-0 items-center justify-center rounded-none ${failed ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
            >
              <PixelIcon name={iconName} className="size-[18px]" />
            </div>
            <div className="min-w-0 flex-1 space-y-2 pt-1.5">
              <div className="flex items-center justify-between gap-2">
                {title && (
                  <ToastTitle className="text-sm font-medium leading-5 [text-wrap:pretty]">
                    {title}
                  </ToastTitle>
                )}
                {action}
              </div>
              {description && (
                <ToastDescription className="text-sm leading-5 text-muted-foreground opacity-100">
                  {description}
                </ToastDescription>
              )}
            </div>
            <ToastClose
              aria-label="Dismiss notification"
              className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring right-1 top-1 flex size-11 items-center justify-center rounded-none p-0 text-muted-foreground opacity-100 hover:bg-muted hover:text-foreground"
            />
          </Toast>
        );
      })}
      <ToastViewport
        position="bottom-right"
        className="gap-3 p-4 sm:p-6 md:max-w-[420px]"
      />
    </ToastProvider>
  );
}

export function showOrderError(
  action: "place" | "approve" | "cancel" | "check",
  error?: unknown,
  id?: string,
) {
  if (id && shown.has(`error:${id}`)) return;
  if (id) shown.add(`error:${id}`);
  const messages = {
    place: "Could not place the order. Please try again.",
    approve: "Could not approve the token. Please try again.",
    cancel: "Could not cancel the order. Please try again.",
    check: "Could not check the transaction. Please try again.",
  };
  toast({
    title: isRejected(error)
      ? "Request cancelled in your wallet."
      : messages[action],
    variant: "destructive",
  });
}

export function showOrderSuccess(
  action: "place" | "cancel",
  order: {
    account: string;
    chainId: ChainId;
    owner: string;
    hash: string;
    parentId?: string;
    source?: string;
  },
  attempt = "",
) {
  const identity = `${order.owner.toLowerCase()}:${order.hash.toLowerCase()}`;
  const id = `${action}:${order.chainId}:${order.account.toLowerCase()}:${identity}:${attempt}`;
  if (shown.has(id)) return;
  shown.add(id);
  const orderId =
    order.parentId && order.source !== "local" ? order.parentId : identity;
  toast({
    title: action === "place" ? "Order placed." : "Order cancelled.",
    action: (
      <ToastAction
        asChild
        altText="View order details"
        className="h-7 gap-1.5 rounded-none border-transparent bg-transparent px-1 text-xs font-normal text-muted-foreground shadow-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Link
          href={`/${order.chainId}/${order.account}/${encodeURIComponent(orderId)}`}
        >
          View order
          <PixelIcon name="external-link" className="size-3.5" />
        </Link>
      </ToastAction>
    ),
    duration: 10_000,
  });
}
