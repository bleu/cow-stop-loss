"use client";

import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@bleu-fi/ui";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useState } from "react";

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
          <h1 className="text-3xl text-foreground">My Stop Loss Orders</h1>
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
            >
              <span className="flex items-center gap-x-2">
                <ReloadIcon />
                <span>Reload</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
      <div className="max-h-[520px] overflow-y-auto rounded-md">
        <Table className="bg-foreground border-0 text-black rounded-md">
          <TableHeader className="bg-primary">
            <TableCell className="rounded-tl-md">
              <span className="sr-only"></span>
            </TableCell>
            <TableCell>
              <span className="sr-only">Selected</span>
            </TableCell>
            <TableCell className="py-4">Tx Datetime</TableCell>
            <TableCell>Sell Token</TableCell>
            <TableCell>Buy Token</TableCell>
            <TableCell>Status</TableCell>
            <TableCell className="rounded-tr-md">
              <span className="sr-only">Cancel</span>
            </TableCell>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRowOrder
                key={order.id}
                order={order}
                setOrdersToCancel={setOrdersToCancel}
                ordersToCancel={ordersToCancel}
              />
            ))}
            {orders?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <h1 className="text-md text-primary-foreground m-2 text-center w-full">
                    This address didn't made any Stop Loss order yet
                  </h1>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
