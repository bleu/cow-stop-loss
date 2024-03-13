import { BaseTransaction } from "@safe-global/safe-apps-sdk";
import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { signatureVerifierMuxerAbi } from "./abis/signatureVerifierMuxer";
import { stopLossArgsEncoder } from "./staticInputEncoder";
import {
  HOOK_TYPES,
  IMintBalData,
  IMultiSendData,
  IStopLossRecipeData,
  IToken,
} from "./types";
import {
  BALANCER_MINTER_ADDRESS,
  COMPOSABLE_COW_ADDRESS,
  EXTENSIBLE_FALLBACK_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  STOP_LOSS_ADDRESS,
  TRAMPOLINE_ADDRESS,
} from "./contracts";
import { FALLBACK_STATES } from "#/hooks/useFallbackState";
import { calculateSellAmount } from "./calculateAmounts";
import { balancerMinterAbi } from "./abis/balancerMinter";

export enum TRANSACTION_TYPES {
  ERC20_APPROVE = "ERC20_APPROVE",
  STOP_LOSS_ORDER = "STOP_LOSS_ORDER",
  SET_FALLBACK_HANDLER = "SET_FALLBACK_HANDLER",
  SET_DOMAIN_VERIFIER = "SET_DOMAIN_VERIFIER",
}

export interface BaseArgs {
  type: TRANSACTION_TYPES | HOOK_TYPES;
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
  createRawTx(args: T): Promise<BaseTransaction | null>;
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
    const salt = `0x${Date.now().toString(16).padEnd(64, "0")}` as Address;
    return {
      to: COMPOSABLE_COW_ADDRESS,
      value: "0",
      data: encodeFunctionData({
        abi: composableCowAbi,
        functionName: "create",
        args: [
          {
            handler: STOP_LOSS_ADDRESS,
            salt: salt,
            staticInput: await stopLossArgsEncoder(data, salt),
          },
          true,
        ],
      }),
    };
  }
}

class FallbackHandlerSetupTx implements ITransaction<setFallbackHandlerArgs> {
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

class DomainVerifierSetupTx implements ITransaction<setDomainVerifierArgs> {
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

class MultiSendHookSetupTx implements ITransaction<IMultiSendData> {
  async createRawTx({}: IMultiSendData): Promise<BaseTransaction | null> {
    return null;
  }
}

class BalMintSetupTx implements ITransaction<IMintBalData> {
  async createRawTx({ chainId }: IMintBalData): Promise<BaseTransaction> {
    return {
      to: BALANCER_MINTER_ADDRESS[chainId],
      value: "0",
      data: encodeFunctionData({
        abi: balancerMinterAbi,
        functionName: "setMinterApproval",
        args: [TRAMPOLINE_ADDRESS, true],
      }),
    };
  }
}

export interface TransactionBindings {
  [TRANSACTION_TYPES.ERC20_APPROVE]: ERC20ApproveArgs;
  [TRANSACTION_TYPES.STOP_LOSS_ORDER]: StopLossOrderArgs;
  [TRANSACTION_TYPES.SET_FALLBACK_HANDLER]: setFallbackHandlerArgs;
  [TRANSACTION_TYPES.SET_DOMAIN_VERIFIER]: setDomainVerifierArgs;
  [HOOK_TYPES.MULTI_SEND]: IMultiSendData;
  [HOOK_TYPES.MINT_BAL]: IMintBalData;
}

export type AllTransactionArgs = TransactionBindings[keyof TransactionBindings];

const TRANSACTION_CREATORS: {
  [key in keyof TransactionBindings]: new () => ITransaction<
    TransactionBindings[key]
  >;
} = {
  [TRANSACTION_TYPES.ERC20_APPROVE]: ERC20ApproveRawTx,
  [TRANSACTION_TYPES.STOP_LOSS_ORDER]: StopLossOrderTx,
  [TRANSACTION_TYPES.SET_FALLBACK_HANDLER]: FallbackHandlerSetupTx,
  [TRANSACTION_TYPES.SET_DOMAIN_VERIFIER]: DomainVerifierSetupTx,
  [HOOK_TYPES.MULTI_SEND]: MultiSendHookSetupTx,
  [HOOK_TYPES.MINT_BAL]: BalMintSetupTx,
};

export class TransactionFactory {
  static async createRawTx<T extends TRANSACTION_TYPES | HOOK_TYPES>(
    type: T,
    args: TransactionBindings[T]
  ): Promise<BaseTransaction | null> {
    const TransactionCreator = TRANSACTION_CREATORS[type];
    const txCreator = new TransactionCreator();
    return txCreator.createRawTx(args);
  }
}

export function createRawTxArgs({
  data,
  safeAddress,
  domainSeparator,
  fallbackState,
}: {
  data: IStopLossRecipeData;
  safeAddress: Address;
  domainSeparator: Address;
  fallbackState: FALLBACK_STATES;
}) {
  const sellAmount = calculateSellAmount(data);

  const setFallbackTx = {
    type: TRANSACTION_TYPES.SET_FALLBACK_HANDLER,
    safeAddress,
  } as setFallbackHandlerArgs;
  const DomainVerifierSetupTx = {
    type: TRANSACTION_TYPES.SET_DOMAIN_VERIFIER,
    safeAddress,
    domainSeparator,
  } as setDomainVerifierArgs;

  const setupTxs = (() => {
    switch (fallbackState) {
      case FALLBACK_STATES.HAS_NOTHING:
        return [setFallbackTx, DomainVerifierSetupTx];
      case FALLBACK_STATES.HAS_EXTENSIBLE_FALLBACK:
        return [DomainVerifierSetupTx];
      default:
        return [];
    }
  })();

  return [
    ...setupTxs,
    ...data.preHooks,
    ...data.postHooks,
    {
      type: TRANSACTION_TYPES.ERC20_APPROVE as const,
      token: data.tokenSell,
      amount: sellAmount,
      spender: GPV2_VAULT_RELAYER_ADDRESS,
    },
    {
      type: TRANSACTION_TYPES.STOP_LOSS_ORDER as const,
      ...data,
    },
  ];
}
