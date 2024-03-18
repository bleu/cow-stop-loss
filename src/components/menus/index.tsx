import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { Node, useNodes } from "reactflow";
import { Address } from "viem";

import { FALLBACK_STATES, useFallbackState } from "#/hooks/useFallbackState";
import { useRawTxData } from "#/hooks/useRawTxData";
import { calculateSellAmount } from "#/lib/calculateAmounts";
import {
  setDomainVerifierArgs,
  setFallbackHandlerArgs,
  TRANSACTION_TYPES,
} from "#/lib/transactionFactory";
import { IHooks, INodeData, IStopLossRecipeData } from "#/lib/types";

import { AlertCard } from "../AlertCard";
import Button from "../Button";
import { Checkbox } from "../Checkbox";
import { Spinner } from "../Spinner";
import { MultiSendMenu } from "./MultiSendMenu";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { StopLossRecipeMenu } from "./StopLossRecipeMenu";
import { SwapMenu } from "./SwapMenu";

const nodeMenus = {
  stopLoss: StopLossConditionMenu,
  swap: SwapMenu,
  hookMultiSend: MultiSendMenu,
};

const spender = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110" as Address;

export default function Menu() {
  const {
    safe
  } = useSafeAppsSDK();
  const [recipeData, setRecipeData] = useState<IStopLossRecipeData>();
  const nodes = useNodes<INodeData>();
  const selected = nodes.find((node) => node.selected);

  useEffect(() => {
    const recipeData = {
      ...(nodes.find((node) => node.id === "condition")
        ?.data as IStopLossRecipeData),
      ...(nodes.find((node) => node.id === "swap")
        ?.data as IStopLossRecipeData),
    };
    const preHooksData = nodes
      .filter((node) => node.type?.includes("preHook"))
      .reduce((acc, node) => {
        return [...acc, node.data as IHooks];
      }, [] as IHooks[]);
    const postHooksData = nodes
      .filter((node) => node.type?.includes("postHook"))
      .reduce((acc, node) => {
        return [...acc, node.data as IHooks];
      }, [] as IHooks[]);

    setRecipeData({
      ...recipeData,
      chainId: safe.chainId,
      preHooks: preHooksData,
      postHooks: postHooksData,
      safeInfo: safe
    } as IStopLossRecipeData);
  }, [nodes]);

  if (!recipeData) {
    return <Spinner />;
  }

  if (!selected || !nodeMenus[selected?.type as keyof typeof nodeMenus]) {
    return <DefaultMenu data={recipeData} />;
  }

  return <SelectedMenu data={recipeData} selected={selected} />;
}

function DefaultMenu({ data }: { data: IStopLossRecipeData }) {
  const {
    safe: { safeAddress },
  } = useSafeAppsSDK();
  const { sendTransactions } = useRawTxData();
  const { fallbackState, domainSeparator } = useFallbackState();
  const needFallbackSetting =
    fallbackState === FALLBACK_STATES.HAS_NOTHING ||
    fallbackState === FALLBACK_STATES.HAS_EXTENSIBLE_FALLBACK;
  const [fallbackSetupApprove, setFallbackSetupApprove] = useState(false);

  if (!domainSeparator) {
    return <Spinner />;
  }

  const createOrder = async () => {
    const setFallbackTx = {
      type: TRANSACTION_TYPES.SET_FALLBACK_HANDLER,
      safeAddress,
    } as setFallbackHandlerArgs;
    const setDomainVerifierTx = {
      type: TRANSACTION_TYPES.SET_DOMAIN_VERIFIER,
      safeAddress,
      domainSeparator,
    } as setDomainVerifierArgs;

    const setupTxs = (() => {
      switch (fallbackState) {
        case FALLBACK_STATES.HAS_NOTHING:
          return [setFallbackTx, setDomainVerifierTx];
        case FALLBACK_STATES.HAS_EXTENSIBLE_FALLBACK:
          return [setDomainVerifierTx];
        default:
          return [];
      }
    })();

    const rawTxs = [
      ...setupTxs,
      {
        type: TRANSACTION_TYPES.ERC20_APPROVE as const,
        token: data.tokenSell,
        amount: sellAmount,
        spender,
      },
      {
        type: TRANSACTION_TYPES.STOP_LOSS_ORDER as const,
        ...data,
      },
    ];
    await sendTransactions(rawTxs);
  };

  const sellAmount = calculateSellAmount(data);
  return (
    <div>
      <div className="flex flex-col m-2 w-full max-h-[39rem] overflow-y-scroll gap-y-2">
        <StopLossRecipeMenu data={data} />
        {needFallbackSetting && (
          <AlertCard style="warning" title="Fallback Setting">
            <span>
              To create the order you need to set the Composable CoW as the
              domain verifier and the Extensible Fallback as the fallback
              handler.
            </span>
            <Checkbox
              id="setFallbackHandler"
              checked={fallbackSetupApprove}
              onChange={() => setFallbackSetupApprove(!fallbackSetupApprove)}
              label="Approve fallback setup"
            />
          </AlertCard>
        )}
        <Button
          type={"submit"}
          disabled={
            (needFallbackSetting && !fallbackSetupApprove) || data.oracleError
          }
          onClick={createOrder}
        >
          Create Order
        </Button>
      </div>
    </div>
  );
}

function SelectedMenu({
  selected,
  data,
}: {
  selected: Node<INodeData>;
  data: IStopLossRecipeData;
}) {
  const MenuComponent = nodeMenus[selected?.type as keyof typeof nodeMenus];

  return (
    <MenuComponent data={data} id={selected.id} defaultValues={selected.data} />
  );
}
