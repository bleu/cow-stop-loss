"use client";

import { TableCell, TableRow } from "@bleu-fi/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";

import { TokenInfo } from "#/components/TokenInfo";
import { StopLossPendingOrderType } from "#/contexts/ordersContext";
import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

import { StatusBadge } from "../StatusBadge";

export function TableRowPendingOrder({
  id,
  order,
}: {
  id: string;
  order: StopLossPendingOrderType;
}) {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();

  return (
    <>
      <TableRow key={id} className="border-transparent">
        <TableCell>
          <span className="sr-only"></span>
        </TableCell>
        <TableCell>
          <span className="sr-only"></span>
        </TableCell>
        <TableCell>Pending</TableCell>
        <TableCell>
          {order?.tokenIn ? (
            <TokenInfo
              token={order?.tokenIn as IToken}
              chainId={chainId as ChainId}
            />
          ) : (
            "Error loading token"
          )}
        </TableCell>
        <TableCell>
          {order?.tokenOut ? (
            <TokenInfo
              token={order?.tokenOut as IToken}
              chainId={chainId as ChainId}
            />
          ) : (
            "Error loading token"
          )}
        </TableCell>
        <TableCell>
          <StatusBadge status={order?.status} />
        </TableCell>
        <TableCell>
          <span className="sr-only"></span>
        </TableCell>
      </TableRow>
    </>
  );
}
