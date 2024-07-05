import { notFound } from "next/navigation";
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
  const defaultOrder = await getProcessedStopLossOrder({
    chainId: params.chainId,
    orderId: params.orderId,
    address: params.safeAddress,
  });

  if (defaultOrder) {
    return (
      <OrderDetails
        defaultOrder={defaultOrder}
        orderId={params.orderId}
        chainId={params.chainId}
        address={params.safeAddress}
      />
    );
  }

  notFound();
}
