import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Node } from "reactflow";
import { Address } from "viem";

import { FALLBACK_STATES, useFallbackState } from "#/hooks/useFallbackState";
import { useRawTxData } from "#/hooks/useRawTxData";
import { calculateSellAmount } from "#/lib/calculateAmounts";
import {
  setDomainVerifierArgs,
  setFallbackHandlerArgs,
  TRANSACTION_TYPES,
} from "#/lib/transactionFactory";
import { INodeData, IStopLossRecipeData } from "#/lib/types";

import { AlertCard } from "../AlertCard";
import { Checkbox } from "../Checkbox";
import { Spinner } from "../Spinner";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { MultiSendMenu } from "./MultiSendMenu";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { StopLossRecipeMenu } from "./StopLossRecipeMenu";
import { SwapMenu } from "./SwapMenu";

const nodeMenus = {
  stopLoss: StopLossConditionMenu,
  swap: SwapMenu,
  multisend: MultiSendMenu,
};

const spender = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110" as Address;

export default function Menu({
  selected,
  data,
  setData,
  setSelected,
}: {
  selected?: Node<INodeData>;
  data: IStopLossRecipeData;
  setData: (data: IStopLossRecipeData) => void;
  setSelected: (node: Node<INodeData> | undefined) => void;
}) {
  if (!selected || !nodeMenus[selected?.type as keyof typeof nodeMenus]) {
    return <DefaultMenu data={data} />;
  }
  return (
    <SelectedMenu
      selected={selected}
      data={data}
      setData={setData}
      setSelected={setSelected}
    />
  );
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
      <div className="flex flex-col m-2 w-full max-h-[40rem] overflow-y-scroll gap-y-2">
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
          disabled={needFallbackSetting && !fallbackSetupApprove}
          onClick={createOrder}
          className="bg-blue9 hover:bg-blue7"
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
  setData,
  setSelected,
}: {
  selected: Node<INodeData>;
  data: IStopLossRecipeData;
  setData: (data: IStopLossRecipeData) => void;
  setSelected: (node: Node<INodeData> | undefined) => void;
}) {
  const form = useForm<FieldValues>({ defaultValues: data });
  const MenuComponent = nodeMenus[selected?.type as keyof typeof nodeMenus];
  return (
    <Form
      {...form}
      onSubmit={(formData: FieldValues) => {
        setData({ ...data, ...formData });
        setSelected(undefined);
      }}
    >
      <div className="m-2 w-full max-h-[50rem] overflow-y-scroll">
        <MenuComponent data={data} form={form} />
        <Button type="submit" className="bg-blue9 hover:bg-blue7 my-2">
          Save
        </Button>
      </div>
    </Form>
  );
}
