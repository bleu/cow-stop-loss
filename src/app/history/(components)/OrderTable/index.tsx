"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@bleu-fi/ui";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { Spinner } from "#/components/Spinner";
import { useUserOrders } from "#/hooks/useOrders";

import { CancelOrdersDialog } from "./CancelOrdersDialog";
import { TableRowOrder } from "./TableRowOrder";

export function OrderTable() {
  const { orders, loaded, reload } = useUserOrders();
  const [ordersToCancel, setOrdersToCancel] = useState<string[]>([]);

  if (!loaded) {
    return <Spinner />;
  }

  return (
    <div className="my-10 flex w-9/12 flex-col gap-y-5">
      <div className="flex items-center justify-between gap-x-8">
        <div className="flex justify-between w-full gap-1">
          <h1 className="text-3xl text-highlight">My Stop Loss Orders</h1>
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
      <div className="overflow-y-auto max-h-[550px] rounded-lg">
        <Table className="bg-foreground text-primary-foreground rounded-lg">
          <TableHeader>
            <TableRow>
              <TableCell>
                <span className="sr-only"></span>
              </TableCell>
              <TableCell>
                <span className="sr-only">Selected</span>
              </TableCell>
              <TableCell>Tx Datetime</TableCell>
              <TableCell>Sell Token</TableCell>
              <TableCell>Buy Token</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto">
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
                  <h1 className="text-md text-slate12 m-2 text-center w-full">
                    This address doesn't have any Stop Loss orders associated to
                    it yet
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
