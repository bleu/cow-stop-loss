import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { encodeFunctionData, erc20Abi } from "viem";

import { Address, IStopLossRecipeData } from "./types";
import { composableCowAbi } from "./abis/composableCow";
import { generateSalt } from "./generateSalt";
import { stopLossArgsEncoder } from "./handlerEncoder";

// Composable COW and StopLoss address is the same for all chains supported chains (mainnet and goerli)
export const COMPOSABLE_COW_ADDRESS =
  "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";
export const STOP_LOSS_ADDRESS = "0xE8212F30C28B4AAB467DF3725C14d6e89C2eB967";

export enum TRANSACTION_TYPES {
  ERC20_APPROVE = "ERC20_APPROVE",
  STOP_LOSS_ORDER = "STOP_LOSS_ORDER",
}

export interface BaseArgs {
  type: TRANSACTION_TYPES;
}

export interface ERC20ApproveArgs extends BaseArgs {
  type: TRANSACTION_TYPES.ERC20_APPROVE;
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
}

export type StopLossOrderArgs = {
  type: TRANSACTION_TYPES.STOP_LOSS_ORDER;
} & BaseArgs &
  IStopLossRecipeData;

interface ITransaction<T> {
  createRawTx(args: T): BaseTransaction;
}

class ERC20ApproveRawTx implements ITransaction<ERC20ApproveArgs> {
  createRawTx({
    tokenAddress,
    spender,
    amount,
  }: ERC20ApproveArgs): BaseTransaction {
    return {
      to: tokenAddress,
      value: "0",
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
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
            salt: generateSalt(),
            staticInput: stopLossArgsEncoder(data),
          },
          true,
        ],
      }),
    };
  }
}

export interface TransactionBindings {
  [TRANSACTION_TYPES.ERC20_APPROVE]: ERC20ApproveArgs;
  [TRANSACTION_TYPES.STOP_LOSS_ORDER]: StopLossOrderArgs;
}

export type AllTransactionArgs = TransactionBindings[keyof TransactionBindings];

const TRANSACTION_CREATORS: {
  [key in keyof TransactionBindings]: new () => ITransaction<
    TransactionBindings[key]
  >;
} = {
  [TRANSACTION_TYPES.ERC20_APPROVE]: ERC20ApproveRawTx,
  [TRANSACTION_TYPES.STOP_LOSS_ORDER]: StopLossOrderTx,
};

export class TransactionFactory {
  static createRawTx<T extends TRANSACTION_TYPES>(
    type: T,
    args: TransactionBindings[T]
  ): BaseTransaction {
    const TransactionCreator = TRANSACTION_CREATORS[type];
    const txCreator = new TransactionCreator();
    return txCreator.createRawTx(args);
  }
}
