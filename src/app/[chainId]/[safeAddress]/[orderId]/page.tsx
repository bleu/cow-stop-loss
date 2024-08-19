import { Address } from "viem";

import { OrderDetails } from "#/components/OrderDetails";
import { ChainId } from "#/lib/publicClients";

export default function OrderPage({
  params,
}: {
  params: {
    safeAddress: Address;
    chainId: ChainId;
    orderId: string;
  };
}) {
  return (
    <OrderDetails
      orderId={params.orderId}
      chainId={params.chainId}
      address={params.safeAddress}
    />
  );
}
