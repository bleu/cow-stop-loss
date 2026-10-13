"use client";

import { Button, Dialog, DialogContent, DialogTitle } from "@bleu/ui";
import type { ReactNode } from "react";
import { formatUnits } from "viem";

import { GPV2_VAULT_RELAYER_ADDRESS } from "#/lib/contracts";
import type { FundingSnapshot, PreparedPlacement } from "#/lib/pollerStopLoss";
import type { ChainId } from "#/lib/publicClients";
import { formatTimeDelta } from "#/lib/timeDelta";
import type { DraftOrder } from "#/lib/types";

import { BlockExplorerLink } from "./ExplorerLink";

export interface ReviewOrdersDialogProps {
  chainId: ChainId;
  order: DraftOrder;
  open: boolean;
  setOpen: (open: boolean) => void;
  prepared?: PreparedPlacement;
  checks?: FundingSnapshot;
  busy?: boolean;
  error?: string;
  approvalStage?: "reset" | "approval";
  pending?: boolean;
  onApprove: () => void;
  onPlace: () => void;
  onRetry: () => void;
}

export function ReviewOrdersDialog({
  chainId,
  order,
  open,
  setOpen,
  prepared,
  checks,
  busy = false,
  pending = false,
  error,
  approvalStage,
  onApprove,
  onPlace,
  onRetry,
}: ReviewOrdersDialogProps) {
  const funding = checks?.status === "known" ? checks : undefined;
  const reviewError =
    error || (checks?.status === "unknown" ? checks.error : undefined);
  const actionsBlocked =
    !prepared || !funding || Boolean(reviewError) || busy || pending;
  const resetRequired =
    funding?.approvalRequired &&
    (approvalStage === "reset" ||
      (funding.currentAllowance > BigInt(0) &&
        funding.currentAllowance < funding.requiredAllowance));
  const sellAmount = (amount: bigint) =>
    `${formatUnits(amount, order.tokenSell.decimals)} ${order.tokenSell.symbol}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-describedby={undefined}
        className="data-[state=open]:animate-contentShow rounded-lg focus:outline-none bg-muted w-[90vw] max-w-[450px] py-6 px-2"
      >
        <div className="flex flex-col gap-3 w-full overflow-y-auto max-h-[85vh] px-3">
          <DialogTitle className="text-2xl font-medium">
            Review Stop Loss order
          </DialogTitle>
          <div className="bg-background/80 rounded-lg p-2">
            <p className="text-xs">Sell exactly</p>
            <p>
              {order.amountSell} {order.tokenSell.symbol}
            </p>
          </div>
          <div className="bg-background/80 rounded-lg p-2">
            <p className="text-xs">Receive at least</p>
            <p>
              {order.amountBuy} {order.tokenBuy.symbol}
            </p>
          </div>
          <dl className="flex flex-col gap-2">
            <OrderInformation title="Trigger price">
              {order.tokenSell.symbol} = {order.strikePrice}{" "}
              {order.tokenBuy.symbol}
            </OrderInformation>
            <OrderInformation title="Slippage">
              {order.slippagePercent}%
            </OrderInformation>
            <OrderInformation title="Receiver">
              <BlockExplorerLink
                type="address"
                identifier={order.receiver}
                networkId={chainId}
              />
            </OrderInformation>
            <OrderInformation title="Expiration date">
              {new Date(order.validTo * 1000)
                .toISOString()
                .replace("T", " ")
                .replace(".000Z", " UTC")}
            </OrderInformation>
          </dl>
          {funding && (
            <div className="text-sm">
              <p>
                {funding.approvalRequired
                  ? `Approve ${sellAmount(funding.requiredAllowance)} for the Poller.`
                  : "Wallet approval is sufficient."}
                {prepared && funding.approvalRequired && (
                  <>
                    {" "}
                    <BlockExplorerLink
                      type="address"
                      identifier={prepared.poller}
                      networkId={chainId}
                    />
                  </>
                )}
              </p>
              {funding.combinedCommitmentsExceedBalance && (
                <p role="alert" className="text-yellow-400">
                  Combined commitments exceed your wallet balance. Funds are not
                  reserved.
                </p>
              )}
            </div>
          )}
          {prepared && (
            <p className="text-sm">
              Placement grants unlimited {order.tokenSell.symbol} settlement
              approval from the CowShed.
            </p>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer">
              Order and approval details
            </summary>
            <div className="flex flex-col gap-3 pt-3">
              <dl className="flex flex-col gap-2">
                <OrderInformation title="Limit price">
                  {order.tokenSell.symbol} = {order.limitPrice}{" "}
                  {order.tokenBuy.symbol}
                </OrderInformation>
                <OrderInformation title="Maximum oracle age">
                  {formatTimeDelta(order.maxHoursSinceOracleUpdates * 3600)}
                </OrderInformation>
                <OrderInformation title="Partial fills">
                  {order.partiallyFillable
                    ? "Allowed"
                    : "Not allowed (Fill or Kill)"}
                </OrderInformation>
                <OrderInformation title={`${order.tokenSell.symbol} oracle`}>
                  <BlockExplorerLink
                    type="address"
                    identifier={order.tokenSellOracle}
                    networkId={chainId}
                  />
                </OrderInformation>
                <OrderInformation title={`${order.tokenBuy.symbol} oracle`}>
                  <BlockExplorerLink
                    type="address"
                    identifier={order.tokenBuyOracle}
                    networkId={chainId}
                  />
                </OrderInformation>
              </dl>
              {funding && (
                <section aria-label="Funding" className="flex flex-col gap-2">
                  <h3 className="font-medium">Funding</h3>
                  <dl className="flex flex-col gap-2">
                    <OrderInformation title="Required allowance">
                      {sellAmount(funding.requiredAllowance)}
                    </OrderInformation>
                    <OrderInformation title="Outstanding unfunded orders">
                      {sellAmount(funding.outstandingSellAmount)}
                    </OrderInformation>
                    <OrderInformation title="Wallet balance">
                      {sellAmount(funding.balance)}
                    </OrderInformation>
                  </dl>
                  <p className="text-sm">
                    Funding totals use indexed orders and orders confirmed in
                    this browser. Orders created elsewhere can be missing until
                    the API indexes them.
                  </p>
                </section>
              )}
              {prepared && (
                <>
                  <section
                    aria-label="Wallet approval"
                    className="flex flex-col gap-2"
                  >
                    <h3 className="font-medium">Wallet approval</h3>
                    <dl className="flex flex-col gap-2">
                      <OrderInformation title="Token">
                        <span>{order.tokenSell.symbol}</span>
                        <BlockExplorerLink
                          type="token"
                          identifier={order.tokenSell.address}
                          networkId={chainId}
                          className="block"
                        />
                      </OrderInformation>
                      <OrderInformation title="Owner (wallet)">
                        <BlockExplorerLink
                          type="address"
                          identifier={prepared.account}
                          networkId={chainId}
                        />
                      </OrderInformation>
                      <OrderInformation title="Spender (Poller)">
                        <BlockExplorerLink
                          type="address"
                          identifier={prepared.poller}
                          networkId={chainId}
                        />
                      </OrderInformation>
                      <OrderInformation title="Current allowance">
                        {funding
                          ? sellAmount(funding.currentAllowance)
                          : "Unavailable"}
                      </OrderInformation>
                      {funding?.approvalRequired && (
                        <>
                          {resetRequired && (
                            <OrderInformation title="Reset allowance to">
                              {sellAmount(BigInt(0))}
                            </OrderInformation>
                          )}
                          <OrderInformation
                            title={
                              resetRequired
                                ? "Approval after reset"
                                : "Approval amount"
                            }
                          >
                            {sellAmount(funding.requiredAllowance)}
                          </OrderInformation>
                        </>
                      )}
                    </dl>
                    {funding && (
                      <p className="text-sm">
                        {funding.approvalRequired
                          ? "Approve only the required total for this order and outstanding unfunded orders."
                          : "Allowance is sufficient. Your existing allowance will not be reduced."}
                      </p>
                    )}
                  </section>
                  <section
                    aria-label="CowShed settlement approval"
                    className="flex flex-col gap-2"
                  >
                    <h3 className="font-medium">CowShed settlement approval</h3>
                    <dl className="flex flex-col gap-2">
                      <OrderInformation title="Token">
                        <span>{order.tokenSell.symbol}</span>
                        <BlockExplorerLink
                          type="token"
                          identifier={order.tokenSell.address}
                          networkId={chainId}
                          className="block"
                        />
                      </OrderInformation>
                      <OrderInformation title="Owner (CowShed)">
                        <BlockExplorerLink
                          type="address"
                          identifier={prepared.owner}
                          networkId={chainId}
                        />
                      </OrderInformation>
                      <OrderInformation title="Spender (Vault Relayer)">
                        <BlockExplorerLink
                          type="address"
                          identifier={GPV2_VAULT_RELAYER_ADDRESS}
                          networkId={chainId}
                        />
                      </OrderInformation>
                      <OrderInformation title="Approval amount">
                        Unlimited {order.tokenSell.symbol}
                      </OrderInformation>
                    </dl>
                    <p className="text-sm">
                      Place order permits the Vault Relayer to spend{" "}
                      {order.tokenSell.symbol} held by this CowShed without an
                      amount limit.
                    </p>
                  </section>
                </>
              )}
            </div>
          </details>
          {pending ? (
            <p role="status" className="text-sm">
              Transaction pending. You can close this review. Tracking will
              continue.
            </p>
          ) : busy ? (
            <p role="status" className="text-sm">
              Checking order...
            </p>
          ) : !reviewError && (!prepared || !checks) ? (
            <p role="status" className="text-sm">
              Preparing review...
            </p>
          ) : null}
          {reviewError && (
            <p role="alert" className="text-sm text-red-400">
              {reviewError}
            </p>
          )}
          {(reviewError || pending) && (
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              disabled={busy}
            >
              Retry
            </Button>
          )}
          {resetRequired && (
            <p className="text-sm">
              Reset the allowance to zero, then approve the required amount.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              disabled={actionsBlocked || !funding?.approvalRequired}
              onClick={onApprove}
            >
              {resetRequired
                ? `Reset ${order.tokenSell.symbol} allowance`
                : `Approve ${order.tokenSell.symbol}`}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={actionsBlocked || funding?.approvalRequired}
              onClick={onPlace}
            >
              Place order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderInformation({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3 text-sm pb-1 border-b border-background">
      <dt>{title}</dt>
      <dd className="text-right break-all">{children}</dd>
    </div>
  );
}
