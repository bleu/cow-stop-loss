import { Address, INode, IStopLossRecipeData } from "@/lib/types";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { SwapMenu } from "./SwapMenu";
import { StopLossRecipeMenu } from "./StopLossRecipeMenu";
import { Form } from "../ui/form";
import { FieldValues, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { calculateSellAmount } from "@/lib/calculateAmounts";
import { TRANSACTION_TYPES } from "@/lib/transactionFactory";
import { useRawTxData } from "@/hooks/useRawTxData";

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
  const { sendTransactions } = useRawTxData();

  const form = useForm<FieldValues>({ defaultValues: data });
  if (!selected) {
    const sellAmount = calculateSellAmount(data);
    return (
      <div>
        <div className="m-2 w-full max-h-[40rem] overflow-y-scroll">
          <StopLossRecipeMenu data={data} />
        </div>
        <Button
          type={"submit"}
          onClick={async () => {
            const rawTxs = [
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
            console.log(rawTxs);
            await sendTransactions(rawTxs);
          }}
          className="m-2 bg-blue9 hover:bg-blue7 my-2"
        >
          Create Order
        </Button>
      </div>
    );
  }
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
