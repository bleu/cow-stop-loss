import { Controller, UseFormReturn } from "react-hook-form";

import { IStopLossRecipeData, TIME_OPTIONS } from "#/lib/types";

import { Input } from "../Input";
import { Select, SelectItem } from "../Select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export function StopLossConditionMenu({
  data,
  form,
}: {
  data: IStopLossRecipeData;
  form: UseFormReturn;
}) {
  const { control } = form;

  return (
    <div>
      <span className="text-md font-bold mb-3">Stop Loss Condition</span>
      <Input
        name="strikePrice"
        label="Strike Price"
        type="number"
        step={1e-18}
      />
      <Accordion className="w-full" type="single" collapsible>
        <AccordionItem value="advancedOptions" key="advancedOption">
          <AccordionTrigger>Advanced Options</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-y-2 mx-2">
              <Input
                name="tokenSellOracle"
                label={`${data.tokenSell?.symbol} Oracle`}
              />
              <Input
                name="tokenBuyOracle"
                label={`${data.tokenBuy?.symbol} Oracle`}
              />
              <Input
                name="maxTimeSinceLastOracleUpdate"
                label="Max Time Since Last Oracle Update"
              />
              <div className="flex flex-col">
                <label className="mb-2 block text-sm">
                  Maximium Time Since Last Oracle Update
                </label>
                <Controller
                  control={control}
                  name="validityBucketTime"
                  render={({ field: { onChange, value, ref } }) => (
                    <Select onValueChange={onChange} value={value} ref={ref}>
                      {Object.entries(TIME_OPTIONS).map(([key, value]) => (
                        <SelectItem key={key} value={String(value)}>
                          {key}
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
  );
}
