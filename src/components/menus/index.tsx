import { Address, INode, IStopLossRecipeData } from "@/lib/types";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { SwapMenu } from "./SwapMenu";
import { StopLossRecipeMenu } from "./StopLossRecipeMenu";
import { Form } from "../ui/form";
import { FieldValues, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { calculateSellAmount } from "@/lib/calculateAmounts";
import {
  TRANSACTION_TYPES,
  setDomainVerifierArgs,
  setFallbackHandlerArgs,
} from "@/lib/transactionFactory";
import { useRawTxData } from "@/hooks/useRawTxData";
import { FALLBACK_STATES, useFallbackState } from "@/hooks/useFallbackState";
import { AlertCard } from "../AlertCard";
import { useState } from "react";
import { Checkbox } from "../Checkbox";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Spinner } from "../Spinner";

const nodeMenus = {
  stopLoss: StopLossConditionMenu,
  swap: SwapMenu,
};

const spender = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110" as Address;

export default function Menu({
  selected,
  data,
  setData,
  setSelected,
}: {
  selected?: INode;
  data: IStopLossRecipeData;
  setData: (data: IStopLossRecipeData) => void;
  setSelected: (node: INode | undefined) => void;
}) {
  if (!selected) {
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
  selected: INode;
  data: IStopLossRecipeData;
  setData: (data: IStopLossRecipeData) => void;
  setSelected: (node: INode | undefined) => void;
}) {
  const form = useForm<FieldValues>({ defaultValues: data });
  const MenuComponent = nodeMenus[selected?.type];
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
