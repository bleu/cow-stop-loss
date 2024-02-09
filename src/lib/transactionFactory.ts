import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { encodeFunctionData, erc20Abi, pad, parseUnits } from "viem";

import { Address, IStopLossRecipeData, IToken } from "./types";
import { composableCowAbi } from "./abis/composableCow";
import { stopLossArgsEncoder } from "./handlerEncoder";
import { signatureVerifierMuxerAbi } from "./abis/signatureVerifierMuxer";

// These addresses are the same for all supported chains (mainnet and goerli)
export const COMPOSABLE_COW_ADDRESS =
  "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74" as const;
export const STOP_LOSS_ADDRESS =
  "0xE8212F30C28B4AAB467DF3725C14d6e89C2eB967" as const;
export const SETTLEMENT_CONTRACT =
  "0x9008D19f58AAbD9eD0D60971565AA8510560ab41" as const;
export const EXTENSIBLE_FALLBACK_ADDRESS =
  "0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5" as const;

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
  createRawTx(args: T): BaseTransaction;
}

class ERC20ApproveRawTx implements ITransaction<ERC20ApproveArgs> {
  createRawTx({ token, spender, amount }: ERC20ApproveArgs): BaseTransaction {
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
  createRawTx(data: StopLossOrderArgs): BaseTransaction {
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
            staticInput: stopLossArgsEncoder(data),
          },
          true,
        ],
      }),
    };
  }
}

class SetFallbackHandlerTx implements ITransaction<setFallbackHandlerArgs> {
  createRawTx({ safeAddress }: setFallbackHandlerArgs): BaseTransaction {
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
  createRawTx({
    safeAddress,
    domainSeparator,
  }: setDomainVerifierArgs): BaseTransaction {
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
  static createRawTx<T extends TRANSACTION_TYPES>(
    type: T,
    args: TransactionBindings[T],
  ): BaseTransaction {
    const TransactionCreator = TRANSACTION_CREATORS[type];
    const txCreator = new TransactionCreator();
    return txCreator.createRawTx(args);
  }
}
