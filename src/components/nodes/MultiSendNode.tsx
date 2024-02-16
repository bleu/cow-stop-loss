import { Address } from "viem";

import { HOOK_TYPES, IMultiSendData, IToken } from "#/lib/types";

import { BaseNode } from ".";

export function MultiSendNode({
  selected,
  data,
}: {
  selected: boolean;
  data: IMultiSendData;
}) {
  return (
    <BaseNode selected={selected}>
      <div className="flex">
        <div className="ml-2">
          <div className="text-sm font-bold">Multi send</div>
          <div className="text-xs text-gray-500">
            {`Send a total of ${data.amountPerReceiver * data.receivers.length} ${data.token.symbol} to ${data.receivers.length} receivers`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export function getDefaultMultiSendData(token: IToken, safeAddress: Address) {
  return {
    receivers: [],
    token: token,
    amountPerReceiver: 0.1,
    safeAddress,
    type: HOOK_TYPES.MULTI_SEND,
  } as IMultiSendData;
}
