import { FormControl } from "@bleu-fi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { slateDarkA } from "@radix-ui/colors";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import {
  Controller,
  FieldError,
  FieldValues,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { useReactFlow } from "reactflow";

import { CHAINS_ORACLE_ROUTER_FACTORY } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { generateStopLossConditionSchema } from "#/lib/schema";
import { IStopLossRecipeData, TIME_OPTIONS } from "#/lib/types";
import { buildBlockExplorerAddressURL, formatNumber } from "#/utils";

import Button from "../Button";
import { BaseInput, Input } from "../Input";
import { Select, SelectItem } from "../Select";
import { Tooltip } from "../Tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Form, FormLabel, FormMessage } from "../ui/form";

const ORACLE_TOOLTIP_TEXT =
  "Please take care when manually editing the address of the oracle contract, as it will determine if the order is ready to be posted and its price.";
const MAX_TIME_SINCE_LAST_ORACLE_UPDATE_TOOLTIP_TEXT =
  "If both oracle has not been updated within this time, the order will not be posted.";

const STRIKE_PRICE_TOOLTIP_TEXT =
  "If the price of the selling relative to the buying tokens is less than this value. This means that even if the selling token fiat price is stable, the order can still happen if the buy token fiat price increases.";

export function StopLossConditionMenu({
  id,
  data,
  defaultValues,
}: {
  id: string;
  data: IStopLossRecipeData;
  defaultValues: FieldValues;
}) {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const stopLossConditionSchema = generateStopLossConditionSchema({
    chainId: chainId as ChainId,
  });
  const form = useForm<typeof stopLossConditionSchema._type>({
    resolver: zodResolver(stopLossConditionSchema),
    defaultValues,
  });
  const { control } = form;

  const { setNodes, getNodes } = useReactFlow();

  const [oraclePrice, setOraclesPrices] = useState<number>();

  const {
    watch,
    formState: { isSubmitting },
  } = form;

  const formData = watch();

  useEffect(() => {
    if (data.tokenSellOracle && data.tokenBuyOracle) {
      const oracleRouter = new CHAINS_ORACLE_ROUTER_FACTORY[chainId as ChainId](
        {
          chainId: chainId as ChainId,
          tokenBuy: data.tokenBuy,
          tokenSell: data.tokenSell,
        }
      );
      oracleRouter
        .calculatePrice({
          tokenBuyOracle: data.tokenBuyOracle,
          tokenSellOracle: data.tokenSellOracle,
        })
        .then((price) => {
          setOraclesPrices(price);
        });
    }
  }, [formData.tokenSellOracle, formData.tokenBuyOracle]);

  const percentageOverOraclePrice = oraclePrice
    ? (formData.strikePrice / oraclePrice - 1) * 100
    : 0;

  const onSubmit = (formData: FieldValues) => {
    const newNodes = getNodes().map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: { ...node.data, ...formData, oracleError: false },
          selected: false,
        };
      }
      return node;
    });
    setNodes(newNodes);
  };

  return (
    <Form {...form} onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 m-2 w-full max-h-[39rem] overflow-y-scroll">
        <div>
          <span className="text-md font-bold mb-2">Stop Loss Condition</span>
          <StrikePriceInput
            form={form}
            data={data}
            percentageOverOraclePrice={percentageOverOraclePrice}
            oraclePrice={oraclePrice}
          />
          <Accordion className="w-full" type="single" collapsible>
            <AccordionItem value="advancedOptions" key="advancedOption">
              <AccordionTrigger>Advanced Options</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-y-2">
                  <Input
                    name="tokenSellOracle"
                    label={`${data.tokenSell?.symbol} Oracle`}
                    tooltipLink={
                      data.tokenSellOracle
                        ? buildBlockExplorerAddressURL({
                            chainId,
                            address: data.tokenSellOracle,
                          })?.url
                        : undefined
                    }
                    tooltipText={ORACLE_TOOLTIP_TEXT}
                  />
                  <Input
                    name="tokenBuyOracle"
                    label={`${data.tokenBuy?.symbol} Oracle`}
                    tooltipLink={
                      data.tokenBuyOracle
                        ? buildBlockExplorerAddressURL({
                            chainId,
                            address: data.tokenBuyOracle,
                          })?.url
                        : undefined
                    }
                    tooltipText={ORACLE_TOOLTIP_TEXT}
                  />
                  <div className="flex flex-col">
                    <div className="flex flex-row justify-between">
                      <FormLabel className="mb-2 block text-sm text-slate12">
                        Max time since last oracle update
                      </FormLabel>
                      <Tooltip
                        content={MAX_TIME_SINCE_LAST_ORACLE_UPDATE_TOOLTIP_TEXT}
                      >
                        <InfoCircledIcon color={slateDarkA.slateA11} />
                      </Tooltip>
                    </div>
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
                              {value}
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
        <Button
          type="submit"
          className="my-2 w-full"
          disabled={percentageOverOraclePrice > 0 || isSubmitting}
        >
          {isSubmitting ? "Saving" : "Save"}
        </Button>
      </div>
    </Form>
  );
}

export function StrikePriceInput({
  form,
  data,
  percentageOverOraclePrice,
  oraclePrice,
}: {
  form: UseFormReturn<{
    strikePrice: number;
    tokenSellOracle: string;
    tokenBuyOracle: string;
    maxTimeSinceLastOracleUpdate: TIME_OPTIONS;
  }>;
  data: IStopLossRecipeData;
  percentageOverOraclePrice: number;
  oraclePrice?: number;
}) {
  const {
    register,
    formState: { errors },
    setValue,
  } = form;

  const error = errors.strikePrice as FieldError | undefined;
  const errorMessage = error?.message;
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between mb-2">
        <div className="flex flex-row gap-2 mb-2 items-center text-sm">
          <span className="text-slate12">
            {`Strike Price (${data.tokenSell?.symbol}/${data.tokenBuy?.symbol})`}
          </span>
          {Math.abs(percentageOverOraclePrice) > 0.01 && (
            <span
              className={
                percentageOverOraclePrice > 0
                  ? "block text-green10"
                  : "block text-tomato10"
              }
            >
              (
              {formatNumber(
                percentageOverOraclePrice,
                2,
                "decimal",
                "standard",
                0.01
              )}{" "}
              %)
            </span>
          )}
        </div>
        <Tooltip content={STRIKE_PRICE_TOOLTIP_TEXT}>
          <InfoCircledIcon color={slateDarkA.slateA11} />
        </Tooltip>
      </div>
      <div className="flex flex-col gap-y-1">
        <FormControl>
          <BaseInput
            {...register("strikePrice")}
            type="number"
            step={1e-18}
            className={errorMessage ? "border border-red-500" : ""}
          />
        </FormControl>
        {oraclePrice && (
          <div className="flex gap-x-1 text-xs">
            <span className="text-slate10">
              <span>Set back to oracle price:</span>
            </span>
            <button
              type="button"
              className="text-blue9 outline-none hover:text-amber9"
              onClick={() => {
                setValue("strikePrice", oraclePrice);
              }}
            >
              {formatNumber(oraclePrice, 4, "decimal", "standard", 0.0001)}
            </button>
          </div>
        )}
      </div>
      {errorMessage && (
        <FormMessage className="mt-1 h-6 text-sm text-tomato10">
          <span>{errorMessage}</span>
        </FormMessage>
      )}
    </div>
  );
}
