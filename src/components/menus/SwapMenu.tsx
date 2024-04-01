import {
  convertStringToNumberAndRoundDown,
  Form,
  formatNumber,
} from "@bleu-fi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useReactFlow } from "reactflow";
import { Address, formatUnits } from "viem";

import { useSafeBalances } from "#/hooks/useSafeBalances";
import { swapSchema } from "#/lib/schema";
import { ISwapData, TIME_OPTIONS } from "#/lib/types";

import { Checkbox } from "../Checkbox";
import { Input } from "../Input";
import { SelectInputForm } from "../SelectInputForm";
import { TokenSelect } from "../TokenSelect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const ALLOWED_SLIPPAGE_TOOLTIP_TEXT =
  "Used, in addition to the strike price, to determine the limit price of the order. The order will not be executed if the price of the token is outside of the limit price.";

const IS_PARTIALLY_FILLABLE_TOOLTIP_TEXT =
  "If checked, the order can be divided into smaller orders and executed separately.";

const VALIDITY_BUCKET_TIME_TOOLTIP_TEXT =
  "How long the order will be valid, after placed on the orderbook.";

export function SwapMenu({
  id,
  data,
  defaultValues,
}: {
  id: string;
  data: ISwapData;
  defaultValues: FieldValues;
}) {
  const { fetchBalance } = useSafeBalances();
  const form = useForm<typeof swapSchema._type>({
    resolver: zodResolver(swapSchema),
    defaultValues,
  });
  const {
    watch,
    setValue,
    formState: { errors },
    handleSubmit,
  } = form;

  const formData = watch();

  const amountDecimals = formData.isSellOrder
    ? formData.tokenSell.decimals
    : formData.tokenBuy.decimals;
  const amountAddress = formData.isSellOrder
    ? formData.tokenSell.address
    : formData.tokenBuy.address;

  const walletAmount = formatUnits(
    BigInt(fetchBalance((amountAddress || "0x") as Address)),
    amountDecimals
  );

  const { setNodes, getNodes } = useReactFlow();

  const onSubmit = async (formData: FieldValues) => {
    const newNodes = getNodes().map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: { ...node.data, ...formData },
        };
      }
      return node;
    });
    setNodes(newNodes);
  };

  useEffect(() => {
    const subscription = watch(() => handleSubmit(onSubmit)());
    return () => subscription.unsubscribe();
  }, [handleSubmit, watch]);

  return (
    <Form {...form}>
      <div className="w-full max-h-[39rem] overflow-y-scroll">
        <div>
          <span className="text-lg font-bold text-highlight mb-2">Swap</span>
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-col gap-y-1">
              <Input
                name="amount"
                label={`Amount to ${formData.isSellOrder ? "sell" : "buy"}`}
                type="number"
                step={1 / 10 ** amountDecimals}
              />
              {walletAmount != "0" && (
                <div className="flex gap-x-1 text-xs">
                  <span>
                    <span>
                      Wallet Balance:{" "}
                      {formatNumber(
                        walletAmount,
                        4,
                        "decimal",
                        "standard",
                        0.0001
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="text-accent outline-none hover:text-accent/70"
                    onClick={() => {
                      setValue(
                        "amount",
                        convertStringToNumberAndRoundDown(walletAmount)
                      );
                    }}
                  >
                    Max
                  </button>
                </div>
              )}
            </div>
            <TokenSelect
              selectedToken={data.tokenSell}
              label="Token to sell"
              onSelectToken={(newToken) => {
                setValue("tokenSell", newToken);
              }}
              errorMessage={errors.tokenSell?.message}
            />
            <TokenSelect
              selectedToken={data.tokenBuy}
              label="Token to buy"
              onSelectToken={(newToken) => {
                setValue("tokenBuy", newToken);
              }}
              errorMessage={errors.tokenBuy?.message}
            />
            <Accordion className="w-full" type="single" collapsible>
              <AccordionItem value="advancedOptions" key="advancedOption">
                <AccordionTrigger>Advanced Options</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-y-2">
                    <Input
                      name="allowedSlippage"
                      label={`Allowed Slippage (%)`}
                      type="number"
                      tooltipText={ALLOWED_SLIPPAGE_TOOLTIP_TEXT}
                      step={0.01}
                    />
                    <Input name="receiver" label="Receiver" />
                    <Checkbox
                      id="isPartiallyFillable"
                      checked={formData.isPartiallyFillable}
                      label="Is Partially Fillable"
                      tooltipText={IS_PARTIALLY_FILLABLE_TOOLTIP_TEXT}
                      onChange={() =>
                        setValue(
                          "isPartiallyFillable",
                          !formData.isPartiallyFillable
                        )
                      }
                    />
                    <Checkbox
                      id="isSellOrder"
                      checked={formData.isSellOrder}
                      label="Is Sell Order"
                      onChange={() =>
                        setValue("isSellOrder", !formData.isSellOrder)
                      }
                    />
                    <SelectInputForm
                      name="validityBucketTime"
                      label="Validity Bucket Time"
                      tooltipText={VALIDITY_BUCKET_TIME_TOOLTIP_TEXT}
                      options={Object.entries(TIME_OPTIONS).map(
                        ([key, value]) => ({
                          id: key,
                          value: String(value),
                        })
                      )}
                      placeholder={formData.validityBucketTime}
                      onValueChange={(validityBucketTime) => {
                        setValue(
                          "validityBucketTime",
                          validityBucketTime as TIME_OPTIONS
                        );
                      }}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </Form>
  );
}
