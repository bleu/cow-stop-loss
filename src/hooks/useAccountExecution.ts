"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import {
  type AccountExecution,
  readAccountExecution,
} from "#/lib/accountExecution";
import { type ChainId, supportedChainIds } from "#/lib/publicClients";

type ExecutionState = AccountExecution | { kind: "checking"; error?: string };

export function useAccountExecution(): ExecutionState {
  const { address, chainId } = useAccount();
  const scope = `${address?.toLowerCase()}:${chainId}`;
  const [state, setState] = useState<{
    scope: string;
    result: ExecutionState;
  }>();
  useEffect(() => {
    if (!address || !supportedChainIds.includes(chainId as ChainId)) return;
    let current = true;
    void readAccountExecution({
      account: address,
      chainId: chainId as ChainId,
    }).then(
      (result) => {
        if (current) setState({ scope, result });
      },
      () => {
        if (current)
          setState({
            scope,
            result: {
              kind: "unsupported",
              error: "Cannot verify this account. Reconnect to try again.",
            },
          });
      },
    );
    return () => {
      current = false;
    };
  }, [address, chainId, scope]);
  if (!address) return { kind: "eoa" };
  if (!supportedChainIds.includes(chainId as ChainId))
    return { kind: "unsupported", error: "Select a supported chain." };
  return state?.scope === scope ? state.result : { kind: "checking" };
}
