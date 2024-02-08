import { INode, IStopLossRecipeData } from "@/lib/types";
import { StopLossConditionMenu } from "./StopLossConditionMenu";
import { SwapMenu } from "./SwapMenu";
import { StopLossRecipeMenu } from "./StopLossRecipeMenu";
import { Form } from "../ui/form";
import { FieldValues, set, useForm } from "react-hook-form";
import { Button } from "../ui/button";

const nodeMenus = {
  stopLoss: StopLossConditionMenu,
  swap: SwapMenu,
};

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
  const form = useForm<FieldValues>({ defaultValues: data });
  if (!selected) {
    return (
      <div className="m-2 w-full max-h-[40rem] overflow-y-scroll">
        <StopLossRecipeMenu data={data} />
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
