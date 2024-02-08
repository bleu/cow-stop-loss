import { IStopLossConditionData, timeOptionsValues } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Input } from "../Input";
import { Controller, UseFormReturn } from "react-hook-form";
import { Select, SelectItem } from "../Select";
import { Checkbox } from "../Checkbox";
import { TokenSelect } from "../TokenSelect";

export function SwapMenu({
  data,
  form,
}: {
  data: IStopLossConditionData;
  form: UseFormReturn;
}) {
  const { control, watch, setValue } = form;

  const isSellOrder = watch("isSellOrder");
  const isPartiallyFillable = watch("isPartiallyFillable");
  return (
    <div>
      <span className="text-md font-bold mb-3">Swap</span>
      <div className="flex flex-col gap-y-2">
        <Input
          name="amount"
          label={`Amount to ${isSellOrder ? "sell" : "buy"}`}
          type="number"
        />
        <TokenSelect
          selectedToken={data.tokenSell}
          tokenType="sell"
          onSelectToken={(newToken) => {
            setValue("tokenSell", newToken);
          }}
        />
        <TokenSelect
          selectedToken={data.tokenBuy}
          tokenType="buy"
          onSelectToken={(newToken) => {
            setValue("tokenBuy", newToken);
          }}
        />
        <Accordion className="w-full" type="single" collapsible>
          <AccordionItem value="advancedOptions" key="advancedOption">
            <AccordionTrigger>Advanced Options</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-y-2 mx-2">
                <Input
                  name="allowedSlippage"
                  label={`Allowed Slippage (%)`}
                  type="number"
                />
                <Input name="receiver" label="Receiver" />
                <Checkbox
                  id="isPartiallyFillable"
                  checked={isPartiallyFillable}
                  label="Is Partially Fillable"
                  onChange={() =>
                    setValue("isPartiallyFillable", !isPartiallyFillable)
                  }
                />
                <Checkbox
                  id="isSellOrder"
                  checked={isSellOrder}
                  label="Is Sell Order"
                  onChange={() => setValue("isSellOrder", !isSellOrder)}
                />
                <div className="flex flex-col">
                  <label className="mb-2 block text-sm text-slate12">
                    Validity Bucket Time
                  </label>
                  <Controller
                    control={control}
                    name="validityBucketTime"
                    render={({ field: { onChange, value, ref } }) => (
                      <Select onValueChange={onChange} value={value} ref={ref}>
                        {timeOptionsValues.map((timeOption) => (
                          <SelectItem key={timeOption} value={timeOption}>
                            {timeOption}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
