import { Form, formatNumber,FormControl, FormMessage } from "@bleu-fi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { slateDarkA } from "@radix-ui/colors";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import {
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
import { buildBlockExplorerAddressURL } from "#/utils";

import { BaseInput, Input } from "../Input";
import { SelectInput } from "../SelectInput";
import { Tooltip } from "../Tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

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

  const { setNodes, getNodes } = useReactFlow();

  const [oraclePrice, setOraclePrices] = useState<number>();

  const { watch, handleSubmit, setValue } = form;

  const formData = watch();

  useEffect(() => {
    const subscription = watch(() =>
      handleSubmit((formData: FieldValues) => {
        const newNodes = getNodes().map((node) => {
          if (node.id === id) {
            const error =
              formData.strikePrice > (oraclePrice || 0)
                ? "STRIKE_PRICE_ABOVE_ORACLE_PRICE"
                : undefined;
            return {
              ...node,
              data: { ...node.data, ...formData, error },
            };
          }
          return node;
        });
        setNodes(newNodes);
      })()
    );
    return () => subscription.unsubscribe();
  }, [handleSubmit, watch, oraclePrice]);

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
          setOraclePrices(price);
        });
    }
  }, [formData.tokenSellOracle, formData.tokenBuyOracle]);

  const percentageOverOraclePrice = oraclePrice
    ? (formData.strikePrice / oraclePrice - 1) * 100
    : 0;

  return (
    <Form {...form}>
      <div className="flex flex-col gap-3 w-full max-h-[39rem] overflow-y-scroll">
        <div>
          <span className="text-lg font-bold text-highlight mb-2">
            Stop Loss Condition
          </span>
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

                  <SelectInput
                    name="maxTimeSinceLastOracleUpdate"
                    onValueChange={(maxTimeSinceLastOracleUpdate) => {
                      setValue(
                        "maxTimeSinceLastOracleUpdate",
                        maxTimeSinceLastOracleUpdate as TIME_OPTIONS
                      );
                    }}
                    options={Object.entries(TIME_OPTIONS).map(
                      ([key, value]) => ({
                        id: key,
                        value: String(value),
                      })
                    )}
                    placeholder={formData.maxTimeSinceLastOracleUpdate}
                    tooltipText={MAX_TIME_SINCE_LAST_ORACLE_UPDATE_TOOLTIP_TEXT}
                    label="Max time since last oracle update"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
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
    <div className="flex flex-col gap-1">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-2 items-center text-sm">
          <span>
            {`Strike Price (${data.tokenSell?.symbol}/${data.tokenBuy?.symbol})`}
          </span>
          {Math.abs(percentageOverOraclePrice) > 0.01 && (
            <span
              className={
                percentageOverOraclePrice > 0
                  ? "block text-destructive"
                  : "block text-success"
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
            className={errorMessage ? "border-destructive" : ""}
          />
        </FormControl>
        {oraclePrice && (
          <div className="flex gap-x-1 text-xs">
            <span>
              <span>Set back to oracle price:</span>
            </span>
            <button
              type="button"
              className="text-accent outline-none hover:text-accent/70"
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
        <FormMessage className="mt-1 h-6 text-sm text-destructive">
          <span>{errorMessage}</span>
        </FormMessage>
      )}
    </div>
  );
}
