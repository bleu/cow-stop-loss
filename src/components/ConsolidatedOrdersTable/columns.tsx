import { ColumnDef } from "@tanstack/react-table";
import { formatUnits } from "viem";

import { NetworkLogo } from "#/components/NetworkLogo";
import { TokenLogo } from "#/components/TokenLogo";
import { useTokenPairPrice } from "#/hooks/useTokenPairPrice";
import { chainNames } from "#/lib/publicClients";
import { PlacementRow } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";

import { StatusBadge } from "../StatusBadge";

function shortAmount(value: string) {
  const [whole, fraction = ""] = value.split(".");
  const visibleFraction = fraction.slice(0, 4).replace(/0+$/, "");
  if (whole === "0" && !visibleFraction && /[1-9]/.test(fraction))
    return "<0.0001";
  return `${whole}${visibleFraction ? `.${visibleFraction}` : ""}`;
}

function placementLabel(row: PlacementRow) {
  if (row.source !== "local" || row.placement.status === "confirmed")
    return undefined;
  const stage = {
    "approval-reset": "Approval reset",
    approval: "Approval",
    setup: "Setup",
  }[row.placement.stage];
  if (row.placement.status === "prompting")
    return `Waiting for wallet: ${stage.toLowerCase()}`;
  if (row.placement.status === "ready")
    return row.placement.stage === "approval-reset"
      ? "Approval reset confirmed. Approval required."
      : "Approval confirmed. Ready to place.";
  return `${stage} pending`;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 8,
  }).format(value);
}

function MarketDistance({ order }: { order: PlacementRow }) {
  const sellToken = {
    ...order.sellToken,
    decimals: order.sellToken.decimals ?? 18,
  };
  const buyToken = {
    ...order.buyToken,
    decimals: order.buyToken.decimals ?? 18,
  };
  const { data: marketPrice } = useTokenPairPrice(
    sellToken,
    buyToken,
    order.chainId,
  );
  if (!marketPrice) return <span className="text-muted-foreground">—</span>;

  const triggerPrice = Number(formatUnits(order.strike, 18));
  const distance = ((marketPrice - triggerPrice) / marketPrice) * 100;
  return (
    <span className="tabular-nums">
      {Math.abs(distance) < 0.005
        ? "At market"
        : `${Math.abs(distance).toFixed(2)}% ${distance >= 0 ? "below" : "above"}`}
    </span>
  );
}

function expiryLabel(validTo: number) {
  const expiry = new Date(validTo * 1000);
  return {
    label: expiry.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    full: expiry.toLocaleString(),
  };
}

export function getColumns(): ColumnDef<PlacementRow>[] {
  return [
    {
      id: "chainId",
      accessorFn: (order) => String(order.chainId),
      enableHiding: true,
      header: "Chain",
      filterFn: (row, id, values: string[]) =>
        values.includes(String(row.getValue(id))),
    },
    {
      id: "order",
      header: "Order",
      cell: ({ row: { original: order } }) => {
        const sell =
          order.sellToken.decimals === null
            ? `${order.sellAmount} base units`
            : formatUnits(order.sellAmount, order.sellToken.decimals);
        const buy =
          order.buyToken.decimals === null
            ? `${order.buyAmount} base units`
            : formatUnits(order.buyAmount, order.buyToken.decimals);
        return (
          <div
            aria-label={`${shortAmount(sell)} ${order.sellToken.symbol} for ${shortAmount(buy)} ${order.buyToken.symbol}`}
            title={`${sell} ${order.sellToken.symbol} for ${buy} ${order.buyToken.symbol}`}
            className="flex min-w-0 items-center gap-2 xl:gap-2.5"
          >
            <div aria-hidden="true" className="flex shrink-0 -space-x-2">
              <TokenLogo
                tokenAddress={order.sellToken.address}
                chainId={order.chainId}
                alt=""
                className="size-6 rounded-full ring-2 ring-card xl:size-7"
                height={28}
                width={28}
              />
              <TokenLogo
                tokenAddress={order.buyToken.address}
                chainId={order.chainId}
                alt=""
                className="size-6 rounded-full ring-2 ring-card xl:size-7"
                height={28}
                width={28}
              />
            </div>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-xs font-semibold tracking-tight tabular-nums xl:text-sm">
                {shortAmount(sell)} {order.sellToken.symbol} for{" "}
                {shortAmount(buy)} {order.buyToken.symbol}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <NetworkLogo
                  chainId={order.chainId}
                  size={14}
                  className="rounded-full"
                />
                {chainNames[order.chainId]}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "trigger",
      header: "Trigger",
      cell: ({ row: { original: order } }) => (
        <span className="whitespace-nowrap text-sm font-medium tabular-nums">
          {formatPrice(Number(formatUnits(order.strike, 18)))}{" "}
          {order.buyToken.symbol}
        </span>
      ),
    },
    {
      id: "distance",
      header: "From market",
      cell: ({ row: { original: order } }) => <MarketDistance order={order} />,
    },
    {
      id: "expiry",
      header: "Expires",
      cell: ({ row: { original: order } }) => {
        const expiry = expiryLabel(order.validTo);
        return (
          <time
            dateTime={new Date(order.validTo * 1000).toISOString()}
            title={expiry.full}
            className="whitespace-nowrap text-sm text-muted-foreground tabular-nums"
          >
            {expiry.label}
          </time>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row: { original: order } }) => {
        const progress = placementLabel(order);
        return progress ? (
          <div className="min-w-32">
            <span className="text-sm font-semibold">Pending</span>
            <p className="mt-0.5 max-w-48 text-xs text-muted-foreground">
              {progress}
            </p>
            {order.source === "local" && order.error && (
              <p
                role="alert"
                className="mt-1 max-w-48 text-xs text-destructive"
              >
                {order.error}
              </p>
            )}
          </div>
        ) : (
          <StatusBadge status={order.status} />
        );
      },
      filterFn: (row, id, values: string[]) => {
        const status = row.original.status;
        const groups: Record<string, OrderStatus[]> = {
          Open: [
            OrderStatus.OPEN,
            OrderStatus.DRAFT,
            OrderStatus.ON_QUEUE,
            OrderStatus.CREATING,
          ],
          Filled: [
            OrderStatus.FULFILLED,
            OrderStatus.PARTIALLY_FILLED,
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLED,
            OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLING,
          ],
          Canceled: [
            OrderStatus.CANCELLED,
            OrderStatus.CANCELLING,
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLED,
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLING,
          ],
          Expired: [
            OrderStatus.EXPIRED,
            OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
          ],
          "Partially filled, cancelled": [
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLED,
            OrderStatus.PARTIALLY_FILLED_AND_CANCELLING,
          ],
          "Partially filled, expired": [
            OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
          ],
        };
        return values.some((group) => groups[group]?.includes(status));
      },
    },
  ];
}
