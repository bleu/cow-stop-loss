import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useReactFlow } from "reactflow";

import { multiSendHookSchema } from "#/lib/schema";
import { IToken } from "#/lib/types";

import Button from "../Button";
import { Input } from "../Input";
import Table from "../Table";
import { TokenSelect } from "../TokenSelect";
import { Form } from "../ui/form";

export function MultiSendMenu({
  id,
  defaultValues,
}: {
  id: string;
  defaultValues: FieldValues;
}) {
  const form = useForm<typeof multiSendHookSchema._type>({
    resolver: zodResolver(multiSendHookSchema),
    defaultValues,
  });
  const { register, setValue, watch } = form;
  const [lengthOfArguments, setLengthOfArguments] = useState(1);
  const formData = watch();

  const { setNodes, getNodes } = useReactFlow();

  const onSubmit = (formData: FieldValues) => {
    const newNodes = getNodes().map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: { ...node.data, ...formData },
          selected: false,
        };
      }
      return node;
    });
    setNodes(newNodes);
  };

  return (
    <Form {...form} onSubmit={onSubmit}>
      <div className="m-2 w-full max-h-[39rem] overflow-y-scroll">
        <div className="flex flex-col w-full gap-y-2 mt-2">
          <TokenSelect
            selectedToken={formData.token as IToken}
            tokenType="send"
            onSelectToken={(newToken) => {
              setValue("token", newToken);
            }}
          />
          <Input
            type="number"
            step={1 / 10 ** (formData.token?.decimals || 18)}
            label="Amount per receiver"
            {...register(`amountPerReceiver`)}
          />
          <Table color="blue" shade="darkWithBorder">
            <Table.HeaderRow>
              <Table.HeaderCell classNames="px-4 py-2">
                Receivers
              </Table.HeaderCell>
              <Table.HeaderCell classNames="px-4 py-2">
                <Button
                  type="button"
                  className="px-2 h-6"
                  onClick={() => {
                    setLengthOfArguments(lengthOfArguments + 1);
                  }}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </Table.HeaderCell>
            </Table.HeaderRow>
            <Table.Body>
              {[...Array(lengthOfArguments).keys()].map((index) => {
                return (
                  <Table.BodyRow key={index}>
                    <Table.BodyCell padding="px-4 py-2">
                      <Input {...register(`receivers.${index}`)} />
                    </Table.BodyCell>
                    <Table.BodyCell padding="px-4 pt-2">
                      <div className="flex items-center justify-center">
                        <button
                          className="justify-self-center text-tomato9 hover:text-tomato10"
                          type="button"
                          onClick={() => {
                            if (lengthOfArguments === 1) return;
                            // @ts-ignore
                            setValue("receivers", [
                              ...formData["receivers"].slice(1, index),
                              ...formData["receivers"].slice(index + 1),
                            ]);
                            setLengthOfArguments(lengthOfArguments - 1);
                          }}
                        >
                          <TrashIcon className="size-6" />
                        </button>
                      </div>
                    </Table.BodyCell>
                  </Table.BodyRow>
                );
              })}
            </Table.Body>
          </Table>
        </div>
        <Button type="submit" className="my-2 w-full">
          Save
        </Button>
      </div>
    </Form>
  );
}
