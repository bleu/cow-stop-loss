import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { HOOK_TYPES, IHooks, IMintBalData, IMultiSendData } from "./types";
import { CoWHook } from "@cowprotocol/app-data/dist/generatedTypes/v0.11.0";
import {
  BALANCER_MINTER_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
  TRAMPOLINE_ADDRESS,
} from "./contracts";
import { BaseTransaction } from "@safe-global/safe-apps-sdk";
import { balancerMinterAbi } from "./abis/balancerMinter";
import { ChainId } from "./publicClients";

const GAS_LIMIT = String(parseUnits("1", 18));

interface IHook<T> {
  createCoWHooks(args: T): CoWHook[];
}

class MultiSendHook implements IHook<IMultiSendData> {
  createCoWHooks({
    token,
    receivers,
    amountPerReceiver,
    safeAddress,
  }: IMultiSendData): CoWHook[] {
    // TODO: This hook doesn't work as expected. The approve will is done from the trampoline contract to the settlement. This means that the multisend will fail
    const amountPerReceiverWithDecimals = parseUnits(
      amountPerReceiver.toString(),
      token.decimals
    );
    const totalAmount = amountPerReceiver * receivers.length;
    const totalAmountWithDecimals = parseUnits(
      totalAmount.toString(),
      token.decimals
    );
    const approveMultiSend: CoWHook = {
      target: token.address,
      callData: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [SETTLEMENT_CONTRACT_ADDRESS, totalAmountWithDecimals],
      }),
      gasLimit: GAS_LIMIT,
    };

    const multiSend = receivers.map((receiver) => ({
      target: token.address,
      callData: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transferFrom",
        args: [safeAddress, receiver, amountPerReceiverWithDecimals],
      }),
      gasLimit: GAS_LIMIT,
    }));
    return [approveMultiSend, ...multiSend];
  }
}

class MintBalHook implements IHook<IMintBalData> {
  createCoWHooks({ chainId, safeAddress, gauges }: IMintBalData): CoWHook[] {
    return [
      {
        target: BALANCER_MINTER_ADDRESS[chainId],
        callData: encodeFunctionData({
          abi: balancerMinterAbi,
          functionName: "mintManyFor",
          args: [gauges, safeAddress],
        }),
        gasLimit: GAS_LIMIT,
      },
    ];
  }
}

export interface HookBindings {
  [HOOK_TYPES.MULTI_SEND]: IMultiSendData;
  [HOOK_TYPES.MINT_BAL]: IMintBalData;
}

export type AllTransactionArgs = HookBindings[keyof HookBindings];

const HOOKS_CREATORS: {
  [key in keyof HookBindings]: new () => IHook<HookBindings[key]>;
} = {
  [HOOK_TYPES.MULTI_SEND]: MultiSendHook,
  [HOOK_TYPES.MINT_BAL]: MintBalHook,
};

export class HookFactory {
  static createCoWHooks(hooks: IHooks[]): CoWHook[] {
    return hooks
      .map((hookData) => {
        const TransactionCreator = HOOKS_CREATORS[hookData.type];
        const txCreator = new TransactionCreator();
        return txCreator.createCoWHooks(hookData);
      })
      .flat();
  }
}
