"use client";

import { Button, Dialog, DialogContent, DialogTitle } from "@bleu/ui";
import { type ReactNode, useEffect, useState } from "react";
import { formatUnits } from "viem";

import { GPV2_VAULT_RELAYER_ADDRESS } from "#/lib/contracts";
import type {
  ApprovalMode,
  FundingSnapshot,
  PreparedPlacement,
} from "#/lib/pollerStopLoss";
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
  pending?: boolean;
  onApprove: (mode: ApprovalMode) => void;
  onPlace: () => void;
  onRetry: () => void;
  onAbandon?: () => void;
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
  onApprove,
  onPlace,
  onRetry,
  onAbandon,
}: ReviewOrdersDialogProps) {
  const [mode, setMode] = useState<ApprovalMode>("limited");
  useEffect(() => setMode("limited"), [order.id, chainId]);
  const funding = checks?.status === "known" ? checks : undefined;
  const reviewError =
    error || (checks?.status === "unknown" ? checks.error : undefined);
  const actionsBlocked =
    !prepared || !funding || Boolean(reviewError) || busy || pending;
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
                  ? `Approve ${mode === "unlimited" ? `unlimited ${order.tokenSell.symbol}` : sellAmount(funding.requiredAllowance)} for the Poller.`
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
              {funding.approvalRequired && (
                <fieldset
                  disabled={actionsBlocked}
                  className="my-2 flex flex-col gap-2"
                >
                  <legend>Wallet approval limit</legend>
                  {(["limited", "unlimited"] as const).map((choice) => (
                    <label key={choice} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="approval-limit"
                        checked={mode === choice}
                        onChange={() => setMode(choice)}
                      />
                      {choice === "limited" ? "Limited" : "Unlimited"}
                    </label>
                  ))}
                  <p>
                    Allowances are shared by orders using the same wallet,
                    token, and spender.
                  </p>
                  {mode === "unlimited" && (
                    <p>Unlimited approval does not reserve funds.</p>
                  )}
                </fieldset>
              )}
              {funding.combinedCommitmentsExceedBalance && (
                <p role="alert" className="text-yellow-400">
                  Combined commitments exceed your wallet balance. Funds are not
                  reserved.
                </p>
              )}
            </div>
          )}
          {prepared && funding && (
            <p className="text-sm">
              {funding.settlementApprovalRequired
                ? `Placement grants unlimited ${order.tokenSell.symbol} settlement approval from the CowShed.`
                : "CowShed settlement approval is sufficient and will stay unchanged."}
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
                        <OrderInformation title="Approval amount">
                          {mode === "unlimited"
                            ? `Unlimited ${order.tokenSell.symbol}`
                            : sellAmount(funding.requiredAllowance)}
                        </OrderInformation>
                      )}
                    </dl>
                    {funding && (
                      <p className="text-sm">
                        {funding.approvalRequired
                          ? mode === "unlimited"
                            ? "Approve the maximum token allowance for the Poller."
                            : "Approve only the required total for this order and outstanding unfunded orders."
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
                      <OrderInformation title="Current allowance">
                        {funding
                          ? sellAmount(funding.currentSettlementAllowance)
                          : "Unavailable"}
                      </OrderInformation>
                      {funding && (
                        <OrderInformation title="Required remaining total">
                          {sellAmount(funding.requiredSettlementAllowance)}
                        </OrderInformation>
                      )}
                      {funding?.settlementApprovalRequired && (
                        <OrderInformation title="Approval amount">
                          Unlimited {order.tokenSell.symbol}
                        </OrderInformation>
                      )}
                    </dl>
                    {funding?.settlementApprovalRequired && (
                      <p className="text-sm">
                        Place order permits the Vault Relayer to spend{" "}
                        {order.tokenSell.symbol} held by this CowShed without an
                        amount limit.
                      </p>
                    )}
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
          {onAbandon && (
            <Button
              type="button"
              variant="outline"
              disabled={busy || pending}
              onClick={onAbandon}
            >
              Abandon placement
            </Button>
          )}
          <div className="flex gap-2">
            {funding?.approvalRequired !== false && (
              <Button
                type="button"
                className="flex-1"
                disabled={actionsBlocked || !funding?.approvalRequired}
                onClick={() => onApprove(mode)}
              >
                Approve {order.tokenSell.symbol}
              </Button>
            )}
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
