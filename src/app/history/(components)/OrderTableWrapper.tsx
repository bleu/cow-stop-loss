import { composableCowSubgraph } from "#/lib/gql/sdk";

import { OrderTable } from "./OrderTable";

export async function OrderTableWrapper() {
  const rawOrders = await composableCowSubgraph.AllOrders();
  const orders = rawOrders.orders.items;

  return <OrderTable orders={orders} />;
}
