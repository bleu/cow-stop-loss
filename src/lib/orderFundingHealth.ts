import { erc20Abi, type PublicClient } from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { composableCowPollerAbi } from "./abis/composableCowPoller";
import {
  COMPOSABLE_COW_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  POLLER_ADDRESS_BY_CHAIN_ID,
  STOP_LOSS_ADDRESS,
} from "./contracts";
import { publicClientsFromIds } from "./publicClients";
import { decodeStopLossStaticInput } from "./staticInputDecoder";
import {
  conditionalOrderHash,
  cowOrderDigest,
  stopLossScheduleId,
} from "./stopLossOrderIdentity";
import type { StopLossOrder } from "./stopLossOrders";

export type OrderFundingHealth =
  | { status: "unknown" }
  | {
      status: "known";
      source: "direct" | "wallet" | "cowshed";
      insufficientBalance: boolean;
      insufficientFundingApproval: boolean;
      insufficientSettlementApproval: boolean;
    };

export async function loadOrderFundingHealth(
  order: StopLossOrder,
  client: PublicClient = publicClientsFromIds[order.chainId],
): Promise<OrderFundingHealth> {
  try {
    const funding = order.funding;
    if (!funding || funding.kind === "unknown") return { status: "unknown" };
    const remainingSell =
      order.sellAmount > (order.executedSellAmount ?? BigInt(0))
        ? order.sellAmount - (order.executedSellAmount ?? BigInt(0))
        : BigInt(0);
    const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
    let source: "direct" | "wallet" | "cowshed" = "direct";
    if (funding.kind === "scheduled") {
      if (
        funding.handler.toLowerCase() !== STOP_LOSS_ADDRESS.toLowerCase() ||
        conditionalOrderHash(
          funding.handler,
          funding.salt,
          funding.staticInput,
        ) !== order.hash.toLowerCase()
      )
        return { status: "unknown" };
      const decoded = decodeStopLossStaticInput(funding.staticInput);
      if (
        !decoded.isSellOrder ||
        decoded.isSellOrder !== order.isSellOrder ||
        decoded.sellToken.toLowerCase() !==
          order.sellToken.address.toLowerCase() ||
        decoded.buyToken.toLowerCase() !==
          order.buyToken.address.toLowerCase() ||
        decoded.sellAmount !== order.sellAmount ||
        decoded.buyAmount !== order.buyAmount ||
        decoded.receiver.toLowerCase() !== order.receiver.toLowerCase() ||
        Number(decoded.validTo) !== order.validTo ||
        decoded.isPartiallyFillable !== order.partiallyFillable
      )
        return { status: "unknown" };
      const poller = POLLER_ADDRESS_BY_CHAIN_ID[order.chainId];
      const id = stopLossScheduleId(
        funding.funder,
        funding.handler,
        order.owner,
        funding.salt,
      );
      const domainSeparator = await client.readContract({
        address: COMPOSABLE_COW_ADDRESS,
        abi: composableCowAbi,
        functionName: "domainSeparator",
        blockNumber,
      });
      const funded = await client.readContract({
        address: poller,
        abi: composableCowPollerAbi,
        functionName: "funded",
        args: [id, cowOrderDigest(funding.staticInput, domainSeparator)],
        blockNumber,
      });
      if (funded) {
        source = "cowshed";
      } else {
        const schedule = await client.readContract({
          address: poller,
          abi: composableCowPollerAbi,
          functionName: "schedules",
          args: [id],
          blockNumber,
        });
        if (
          schedule[0].toLowerCase() !== funding.handler.toLowerCase() ||
          schedule[2].toLowerCase() !== funding.funder.toLowerCase() ||
          schedule[3].toLowerCase() !== order.owner.toLowerCase() ||
          schedule[4].toLowerCase() !== funding.salt.toLowerCase() ||
          schedule[5].toLowerCase() !== funding.staticInput.toLowerCase()
        )
          return { status: "unknown" };
        source = "wallet";
      }
    }
    const walletFunding =
      source === "wallet" && funding.kind === "scheduled" ? funding : null;
    const [balance, settlementAllowance, fundingAllowance] = await Promise.all([
      source === "cowshed"
        ? Promise.resolve(null)
        : client.readContract({
            address: order.sellToken.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [walletFunding ? walletFunding.funder : order.owner],
            blockNumber,
          }),
      client.readContract({
        address: order.sellToken.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [order.owner, GPV2_VAULT_RELAYER_ADDRESS],
        blockNumber,
      }),
      walletFunding
        ? client.readContract({
            address: order.sellToken.address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [
              walletFunding.funder,
              POLLER_ADDRESS_BY_CHAIN_ID[order.chainId],
            ],
            blockNumber,
          })
        : Promise.resolve(null),
    ]);
    return {
      status: "known",
      source,
      insufficientBalance:
        balance !== null &&
        balance < (walletFunding ? order.sellAmount : remainingSell),
      insufficientFundingApproval:
        fundingAllowance !== null && fundingAllowance < order.sellAmount,
      insufficientSettlementApproval: settlementAllowance < remainingSell,
    };
  } catch {
    return { status: "unknown" };
  }
}
