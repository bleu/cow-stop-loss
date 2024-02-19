import { BaseTransaction } from "@safe-global/safe-apps-sdk";
import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { signatureVerifierMuxerAbi } from "./abis/signatureVerifierMuxer";
import { stopLossArgsEncoder } from "./staticInputEncoder";
import { IStopLossRecipeData, IToken } from "./types";
import {
  COMPOSABLE_COW_ADDRESS,
  EXTENSIBLE_FALLBACK_ADDRESS,
  STOP_LOSS_ADDRESS,
} from "./contracts";

export enum TRANSACTION_TYPES {
  ERC20_APPROVE = "ERC20_APPROVE",
  STOP_LOSS_ORDER = "STOP_LOSS_ORDER",
  SET_FALLBACK_HANDLER = "SET_FALLBACK_HANDLER",
  SET_DOMAIN_VERIFIER = "SET_DOMAIN_VERIFIER",
}

export interface BaseArgs {
  type: TRANSACTION_TYPES;
}

export interface ERC20ApproveArgs extends BaseArgs {
  type: TRANSACTION_TYPES.ERC20_APPROVE;
  token: IToken;
  spender: Address;
  amount: number;
}

export interface StopLossOrderArgs extends BaseArgs, IStopLossRecipeData {
  type: TRANSACTION_TYPES.STOP_LOSS_ORDER;
}

export interface setFallbackHandlerArgs extends BaseArgs {
  safeAddress: Address;
}

export interface setDomainVerifierArgs extends BaseArgs {
  safeAddress: Address;
  domainSeparator: Address;
}

interface ITransaction<T> {
  createRawTx(args: T): Promise<BaseTransaction>;
}

class ERC20ApproveRawTx implements ITransaction<ERC20ApproveArgs> {
  async createRawTx({
    token,
    spender,
    amount,
  }: ERC20ApproveArgs): Promise<BaseTransaction> {
    const amountBigInt = parseUnits(String(amount), 18);
    return {
      to: token.address,
      value: "0",
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amountBigInt],
      }),
    };
  }
}

class StopLossOrderTx implements ITransaction<StopLossOrderArgs> {
  async createRawTx(data: StopLossOrderArgs): Promise<BaseTransaction> {
    return {
      to: COMPOSABLE_COW_ADDRESS,
      value: "0",
      data: encodeFunctionData({
        abi: composableCowAbi,
        functionName: "create",
        args: [
          {
            handler: STOP_LOSS_ADDRESS,
            salt: `0x${Date.now().toString(16).padEnd(64, "0")}`,
            staticInput: await stopLossArgsEncoder(data),
          },
          true,
        ],
      }),
    };
  }
}

class SetFallbackHandlerTx implements ITransaction<setFallbackHandlerArgs> {
  async createRawTx({
    safeAddress,
  }: setFallbackHandlerArgs): Promise<BaseTransaction> {
    return {
      to: safeAddress,
      value: "0",
      data: encodeFunctionData({
        abi: signatureVerifierMuxerAbi,
        functionName: "setFallbackHandler",
        args: [EXTENSIBLE_FALLBACK_ADDRESS],
      }),
    };
  }
}

class setDomainVerifierTx implements ITransaction<setDomainVerifierArgs> {
  async createRawTx({
    safeAddress,
    domainSeparator,
  }: setDomainVerifierArgs): Promise<BaseTransaction> {
    return {
      to: safeAddress,
      value: "0",
      data: encodeFunctionData({
        abi: signatureVerifierMuxerAbi,
        functionName: "setDomainVerifier",
        args: [domainSeparator, COMPOSABLE_COW_ADDRESS],
      }),
    };
  }
}

export interface TransactionBindings {
  [TRANSACTION_TYPES.ERC20_APPROVE]: ERC20ApproveArgs;
  [TRANSACTION_TYPES.STOP_LOSS_ORDER]: StopLossOrderArgs;
  [TRANSACTION_TYPES.SET_FALLBACK_HANDLER]: setFallbackHandlerArgs;
  [TRANSACTION_TYPES.SET_DOMAIN_VERIFIER]: setDomainVerifierArgs;
}

export type AllTransactionArgs = TransactionBindings[keyof TransactionBindings];

const TRANSACTION_CREATORS: {
  [key in keyof TransactionBindings]: new () => ITransaction<
    TransactionBindings[key]
  >;
} = {
  [TRANSACTION_TYPES.ERC20_APPROVE]: ERC20ApproveRawTx,
  [TRANSACTION_TYPES.STOP_LOSS_ORDER]: StopLossOrderTx,
  [TRANSACTION_TYPES.SET_FALLBACK_HANDLER]: SetFallbackHandlerTx,
  [TRANSACTION_TYPES.SET_DOMAIN_VERIFIER]: setDomainVerifierTx,
};

export class TransactionFactory {
  static async createRawTx<T extends TRANSACTION_TYPES>(
    type: T,
    args: TransactionBindings[T]
  ): Promise<BaseTransaction> {
    const TransactionCreator = TRANSACTION_CREATORS[type];
    const txCreator = new TransactionCreator();
    return txCreator.createRawTx(args);
  }
}
