"use client";

import { Button } from "@bleu-fi/ui";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { Spinner } from "#/components/Spinner";
import Table from "#/components/Table";
import { useOrder } from "#/contexts/ordersContext";

import { CancelOrdersDialog } from "../CancelOrdersDialog";
import { TableRowOrder } from "./TableRowOrder";

export function OrderTable() {
  const { orders, loaded, reload } = useOrder()
  const [ordersToCancel, setOrdersToCancel] = useState<string[]>([]);

  if (!loaded) {
    return <Spinner />;
  }

  return (
    <div className="my-10 flex w-9/12 flex-col gap-y-5">
      <div className="flex items-center justify-between gap-x-8">
        <div className="flex justify-between w-full gap-1">
          <h1 className="text-3xl text-slate12">My Stop Loss Orders</h1>
          <div className="flex items-center gap-x-2">
            <CancelOrdersDialog
              ordersToCancel={ordersToCancel}
              disabled={ordersToCancel.length < 1}
            />
            <Button
              onClick={() => {
                reload({ showSpinner: true });
                setOrdersToCancel([]);
              }}
              className="bg-blue9 text-slate12 hover:bg-blue10 border-blue9"
            >
              <span className="flex items-center gap-x-2">
                <ReloadIcon />
                <span>Reload</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
      <Table
        color="blue"
        shade="darkWithBorder"
        classNames="overflow-y-auto max-h-[500px]"
      >
        <Table.HeaderRow>
          <Table.HeaderCell>
            <span className="sr-only"></span>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <span className="sr-only">Selected</span>
          </Table.HeaderCell>
          <Table.HeaderCell>Tx Datetime</Table.HeaderCell>
          <Table.HeaderCell>Sell Token</Table.HeaderCell>
          <Table.HeaderCell>Buy Token</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
        </Table.HeaderRow>
        <Table.Body classNames="overflow-y-auto">
          {orders?.map((order) => (
            <TableRowOrder
              key={order.id}
              order={order}
              setOrdersToCancel={setOrdersToCancel}
              ordersToCancel={ordersToCancel}
            />
          ))}
          {orders?.length === 0 && (
            <Table.BodyRow>
              <Table.BodyCell colSpan={6}>
                <h1 className="text-md text-slate12 m-2 text-center w-full">
                  This address didn't made any Stop Loss order yet
                </h1>
              </Table.BodyCell>
            </Table.BodyRow>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}
