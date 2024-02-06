import { IStopLossRecipeData } from "@/lib/types";
import { Input } from "../Input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { UseFormReturn } from "react-hook-form";

export function StopLossConditionMenu({
  data,
  form,
}: {
  data: IStopLossRecipeData;
  form: UseFormReturn;
}) {
  return (
    <div>
      <span className="text-md font-bold mb-3">Stop Loss Condition</span>
      <Input name="strikePrice" label="Strike Price" type="number" />
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
