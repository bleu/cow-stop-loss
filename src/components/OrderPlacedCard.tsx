import { Button } from "@bleu/ui";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { PixelIcon } from "#/components/ui/pixel-icon";
import type { PreparedPlacement } from "#/lib/pollerStopLoss";
import { chainNames } from "#/lib/publicClients";
import { formatTokenAmount } from "#/utils/amountFormatting";

export function OrderPlacedCard({
  order,
  onNewOrder,
}: {
  order: PreparedPlacement;
  onNewOrder: () => void;
}) {
  const titleId = useId();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);

  const {
    amountSell,
    amountBuy,
    strikePrice,
    limitPrice,
    tokenSell,
    tokenBuy,
  } = order.draft;
  const priceUnit = `${tokenBuy.symbol} per ${tokenSell.symbol}`;
  const orderId = `${order.owner.toLowerCase()}:${order.paramsHash.toLowerCase()}`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-1 flex-col gap-5 p-2 sm:p-4"
    >
      <header className="grid justify-items-center gap-2 pt-3 text-center">
        <div className="pixel-inset grid size-14 place-items-center [--pixel-edge:hsl(var(--success)/0.4)] [--pixel-surface:hsl(var(--success)/0.1)]">
          <PixelIcon name="check-circle" className="size-8 text-success" />
        </div>
        <h2
          id={titleId}
          ref={title}
          tabIndex={-1}
          className="font-serif text-[30px] font-semibold leading-tight"
        >
          Order placed
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your Stop-Loss Order setup is confirmed on-chain.
        </p>
      </header>
      <div className="pixel-inset grid gap-3 p-4 [--pixel-surface:hsl(var(--muted))]">
        <p className="border-b border-border/60 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {chainNames[order.chainId]}
        </p>
        <dl className="grid grid-cols-2 gap-3 break-words text-sm tabular-nums">
          <div>
            <dt className="text-xs text-muted-foreground">Sell</dt>
            <dd className="font-semibold">
              {formatTokenAmount(amountSell, tokenSell.decimals)}{" "}
              {tokenSell.symbol}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Receive at least</dt>
            <dd className="font-semibold">
              {formatTokenAmount(amountBuy, tokenBuy.decimals)}{" "}
              {tokenBuy.symbol}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Trigger price</dt>
            <dd className="font-semibold text-primary">
              {formatTokenAmount(strikePrice)} {priceUnit}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Limit price</dt>
            <dd className="font-semibold">
              {formatTokenAmount(limitPrice)} {priceUnit}
            </dd>
          </div>
        </dl>
      </div>
      <div className="grid gap-1">
        <Button
          type="button"
          className="pixel-control rescue-primary-button min-h-11 w-full rounded-none font-semibold uppercase tracking-wide"
          onClick={onNewOrder}
        >
          Create another order
          <PixelIcon name="arrow-right" className="ml-2 size-4" />
        </Button>
        <Link
          href={`/${order.chainId}/${order.account}/${encodeURIComponent(orderId)}`}
          className="inline-flex min-h-11 items-center justify-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View order
        </Link>
      </div>
    </section>
  );
}
