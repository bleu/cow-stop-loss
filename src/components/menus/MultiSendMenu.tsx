import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

import { IMultiSendData, IStopLossRecipeData, IToken } from "#/lib/types";

import { Input } from "../Input";
import Table from "../Table";
import { Button } from "../ui/button";

export function MultiSendMenu({
  data,
  form,
}: {
  data: IStopLossRecipeData;
  form: UseFormReturn;
}) {
  const { register, setValue } = form;
  const [lengthOfArguments, setLengthOfArguments] = useState(1);

  return (
    <div className="flex flex-col w-full gap-y-2 mt-2">
      <Table color="blue" shade="darkWithBorder">
        <Table.HeaderRow>
          <Table.HeaderCell>Receiver</Table.HeaderCell>
          <Table.HeaderCell>Amount</Table.HeaderCell>
          <Table.HeaderCell>
            <Button
              type="button"
              className="px-5 py-2"
              onClick={() => {
                setLengthOfArguments(lengthOfArguments + 1);
              }}
            >
              <PlusIcon className="size-5 items-end" />
            </Button>
          </Table.HeaderCell>
        </Table.HeaderRow>
        <Table.Body>
          {[...Array(lengthOfArguments).keys()].map((index) => {
            return (
              <Table.BodyRow key={index}>
                <Table.BodyCell>
                  <Input {...register(``)} />
                </Table.BodyCell>
                <Table.BodyCell>
                  <Input
                    type={arg.inputType}
                    key={argName}
                    defaultValue={defaultValues?.[argName]}
                    step={arg.step}
                    {...register(argName)}
                  />
                </Table.BodyCell>
                <Table.BodyCell>
                  <div className="flex items-center justify-center gap-x-2">
                    <button
                      className="justify-self-center text-tomato9 hover:text-tomato10"
                      type="button"
                      onClick={() => {
                        arrayArguments.forEach((arg) => {
                          setValue(arg.name, [
                            ...formData[arg.name].slice(0, index),
                            ...formData[arg.name].slice(index + 1),
                          ]);
                          setLengthOfArguments(lengthOfArguments - 1);
                        });
                      }}
                    >
                      <TrashIcon className="size-7" />
                    </button>
                  </div>
                </Table.BodyCell>
              </Table.BodyRow>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}

export const getDefaultSwapData = (token: IToken) =>
  ({
    receivers: [],
    token: token,
    amounts: [],
  }) as IMultiSendData;
