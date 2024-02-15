import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { HOOK_TYPES, IHooks, IMultiSendData } from "./types";
import { CoWHook } from "@cowprotocol/app-data/dist/generatedTypes/v0.11.0";
import { SETTLEMENT_CONTRACT } from "./contracts";

const GAS_LIMIT = "1000000";

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
        args: [SETTLEMENT_CONTRACT, totalAmountWithDecimals],
      }),
      gasLimit: GAS_LIMIT,
    };
    const multiSend = receivers.map((receiver) => ({
      target: SETTLEMENT_CONTRACT,
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

export interface HookBindings {
  [HOOK_TYPES.MULTI_SEND]: IMultiSendData;
}

export type AllTransactionArgs = HookBindings[keyof HookBindings];

const HOOKS_CREATORS: {
  [key in keyof HookBindings]: new () => IHook<HookBindings[key]>;
} = {
  [HOOK_TYPES.MULTI_SEND]: MultiSendHook,
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
