import {
  Card,
  CardContent,
  CardTitle,
  convertStringToNumberAndRoundDown,
  formatNumber,
} from "@bleu/ui";
import { useForm } from "react-hook-form";

import { IToken } from "#/lib/types";

import { Input } from "./Input";
import { TokenSelect } from "./TokenSelect";

export function TokenInputCard({
  form,
  side,
}: {
  form: ReturnType<typeof useForm>;
  side: "Sell" | "Buy";
}) {
  const { watch, setValue, register } = form;

  const token = watch(`token${side}`);

  const fieldName = `amount${side}`;

  return (
    <Card className="bg-background text-foreground w-full p-2 rounded-none">
      <CardTitle className="w-full flex justify-between">
        <span className="text-base">{side} amount</span>
      </CardTitle>
      <CardContent className="flex justify-between gap-2 px-0 py-2 items-start">
        <div className="flex flex-col gap-y-1 w-full">
          <TokenSelect
            selectedToken={token as IToken}
            onSelectToken={(newToken) => {
              setValue("tokenSell", newToken);
              // updateOracles(newToken, formData.tokenBuy as IToken);
            }}
            //   errorMessage={errors.tokenSell?.message}
          />
          <span className="text-sm text-foreground/70">
            <span>
              Balance: {formatNumber("10", 4, "decimal", "standard", 0.0001)}{" "}
            </span>
            <button
              type="button"
              className="text-accent outline-none hover:text-accent/70"
              onClick={() => {
                setValue(fieldName, convertStringToNumberAndRoundDown("10"));
              }}
            >
              Max
            </button>
          </span>
        </div>
        <div className="flex flex-col gap-y-1 w-full items-end">
          <Input
            {...register(fieldName)}
            type="number"
            step={1 / 10 ** (token ? token.decimals : 18)}
            placeholder="0.0"
            className="text-2xl text-right"
          />
          <i className="text-sm text-foreground/70">$100</i>
        </div>
      </CardContent>
    </Card>
  );
}
