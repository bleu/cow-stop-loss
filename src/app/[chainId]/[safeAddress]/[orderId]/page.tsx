import { Address } from "viem";

import { OrderDetails } from "#/components/OrderDetails";
import { getProcessedStopLossOrder } from "#/lib/orderFetcher";
import { ChainId } from "#/lib/publicClients";

export default async function OrderPage({
  params,
}: {
  params: {
    safeAddress: Address;
    chainId: ChainId;
    orderId: string;
  };
}) {
  const order = await getProcessedStopLossOrder({
    chainId: params.chainId,
    orderId: params.orderId,
    address: params.safeAddress,
  });

  if (order) {
    return <OrderDetails order={order} />;
  }

  return <div>Order not found</div>;
}
