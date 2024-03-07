import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FieldValues, useForm } from "react-hook-form";

import { stopLossConditionSchema } from "#/lib/schema";
import { IStopLossRecipeData, TIME_OPTIONS } from "#/lib/types";

import Button from "../Button";
import { Input } from "../Input";
import { Select, SelectItem } from "../Select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Form } from "../ui/form";

export function StopLossConditionMenu({
  data,
  defaultValues,
  onSubmit,
}: {
  data: IStopLossRecipeData;
  defaultValues: FieldValues;
  onSubmit: (data: FieldValues) => void;
}) {
  const form = useForm<typeof stopLossConditionSchema._type>({
    resolver: zodResolver(stopLossConditionSchema),
    defaultValues,
  });
  const { control } = form;

  return (
    <Form {...form} onSubmit={onSubmit}>
      <div className="m-2 w-full max-h-[39rem] overflow-y-scroll">
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
                  <div className="flex flex-col">
                    <label className="mb-2 block text-sm">
                      Maximium Time Since Last Oracle Update
                    </label>
                    <Controller
                      control={control}
                      name="maxTimeSinceLastOracleUpdate"
                      render={({ field: { onChange, value, ref } }) => (
                        <Select
                          onValueChange={onChange}
                          value={value}
                          ref={ref}
                        >
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
        <Button type="submit" className="my-2 w-full">
          Save
        </Button>
      </div>
    </Form>
  );
}
