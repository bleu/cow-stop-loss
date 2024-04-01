import {
  Form,
  formatNumber,
  FormControl,
  FormLabel,
  FormMessage,
  useToast,
} from "@bleu-fi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import {
  FieldError,
  FieldValues,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { useReactFlow } from "reactflow";
import { Address } from "viem";

import { CHAINS_ORACLE_ROUTER_FACTORY } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { stopLossConditionSchema } from "#/lib/schema";
import { IStopLossRecipeData, TIME_OPTIONS } from "#/lib/types";
import { buildBlockExplorerAddressURL } from "#/utils";

import { BaseInput, Input } from "../Input";
import { SelectInputForm } from "../SelectInputForm";
import { InfoTooltip } from "../Tooltip";
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
  const form = useForm<typeof stopLossConditionSchema._type>({
    resolver: zodResolver(stopLossConditionSchema),
    defaultValues,
  });
  const { toast } = useToast();

  const { setNodes, getNodes } = useReactFlow();

  const oracleRouterFactory = CHAINS_ORACLE_ROUTER_FACTORY[chainId as ChainId];
  const oracleRouter = new oracleRouterFactory({
    chainId: chainId as ChainId,
    tokenSell: data.tokenSell,
    tokenBuy: data.tokenBuy,
  });

  const [oraclePrice, setOraclePrices] = useState<number>();
  const { watch, handleSubmit, setValue } = form;

  const formData = watch();

  const loadChainlinkOracles = async () => {
    try {
      const oracles = await oracleRouter.findRoute();
      const oraclePrice = await oracleRouter.calculatePrice(oracles);
      setValue("tokenSellOracle", oracles.tokenSellOracle);
      setValue("tokenBuyOracle", oracles.tokenBuyOracle);
      setValue("strikePrice", oraclePrice);
    } catch {
      toast({
        title: "Oracle not found",
        description: "Could not find Chainlink oracles for this token pair",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    (async () => {
      await loadChainlinkOracles();
    })();
  }, []);

  useEffect(() => {
    const subscription = watch(() =>
      handleSubmit(async (formData: FieldValues) => {
        const newPrice = await oracleRouter.calculatePrice({
          tokenBuyOracle: formData.tokenBuyOracle as Address,
          tokenSellOracle: formData.tokenSellOracle as Address,
        });
        setOraclePrices(newPrice);
        const newNodes = getNodes().map((node) => {
          if (node.id === id) {
            const error =
              formData.strikePrice > (newPrice || 0)
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

  const percentageOverOraclePrice = oraclePrice
    ? (formData.strikePrice / oraclePrice - 1) * 100
    : 0;

  return (
    <Form {...form}>
      <div className="w-full max-h-[39rem] overflow-y-scroll">
        <div>
          <span className="text-lg font-bold text-highlight mb-2">
            Stop Loss Condition
          </span>
          <div className="flex flex-col gap-y-2">
            <StrikePriceInput
              form={form}
              data={data}
              percentageOverOraclePrice={percentageOverOraclePrice}
              oraclePrice={oraclePrice}
            />
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
            <div className="w-full">
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
              <button
                type="button"
                className="text-accent outline-none hover:text-accent/70 text-xs"
                onClick={loadChainlinkOracles}
              >
                Load Chainlink oracles
              </button>
            </div>
            <Accordion className="w-full" type="single" collapsible>
              <AccordionItem value="advancedOptions" key="advancedOption">
                <AccordionTrigger>Advanced Options</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-y-2">
                    <SelectInputForm
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
                      tooltipText={
                        MAX_TIME_SINCE_LAST_ORACLE_UPDATE_TOOLTIP_TEXT
                      }
                      label="Max time since last oracle update"
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
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-2 items-center text-sm">
          <FormLabel className="mb-2 block text-sm">
            {`Strike Price (${data.tokenSell?.symbol}/${data.tokenBuy?.symbol})`}
          </FormLabel>
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
        <InfoTooltip text={STRIKE_PRICE_TOOLTIP_TEXT} />
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
        <FormMessage className="my-1 h-6 text-sm text-destructive">
          <span>{errorMessage}</span>
        </FormMessage>
      )}
    </div>
  );
}
