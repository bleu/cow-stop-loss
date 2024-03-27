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

import { Spinner } from "#/components/Spinner";
import { useUserOrders } from "#/hooks/useOrders";

import { TableRowOrder } from "./TableRowOrder";

export function OrderTable() {
  const { orders, loaded, reload } = useUserOrders();

  if (!loaded) {
    return <Spinner />;
  }

  return (
    <div className="my-10 flex w-9/12 flex-col gap-y-5">
      <div className="flex items-center justify-between gap-x-8">
        <div className="flex justify-between w-full gap-1">
          <h1 className="text-3xl text-accent">My Stop Loss Orders</h1>
          <Button
            onClick={() => {
              reload({ showSpinner: true });
            }}
          >
            <span className="flex items-center gap-x-2">
              <ReloadIcon />
              <span>Reload</span>
            </span>
          </Button>
        </div>
      </div>
      <Table className="bg-foreground text-primary-foreground rounded-lg">
        <TableHeader className="border-b border-text-primary">
          <TableCell>
            <span className="sr-only"></span>
          </TableCell>
          <TableCell>Tx Datetime</TableCell>
          <TableCell>Sell Token</TableCell>
          <TableCell>Buy Token</TableCell>
          <TableCell>Status</TableCell>
        </TableHeader>
        <TableBody>
          {orders?.map((order) => (
            <TableRowOrder key={order.id} order={order} />
          ))}
          {orders?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <h1 className="text-md m-2 text-center w-full">
                  This address didn't made any Stop Loss order yet
                </h1>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
