/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";

import {
  assertOrderSizeLimit,
  ORDER_SIZE_LIMIT_EXCEEDED_ERROR,
} from "#/lib/orderSizeLimit";
import type { ChainId } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { useOrderSizeLimit } from "../useOrderSizeLimit";

jest.mock("#/lib/orderSizeLimit", () => ({
  ...jest.requireActual("#/lib/orderSizeLimit"),
  assertOrderSizeLimit: jest.fn(),
}));

const token: IToken = {
  address: "0x1111111111111111111111111111111111111111",
  symbol: "TEST",
  decimals: 18,
};
const input = { chainId: 1 as ChainId, tokenSell: token, sellAmount: "1" };

function wrapper({ children }: PropsWithChildren) {
  return (
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      {children}
    </SWRConfig>
  );
}

beforeEach(() => {
  jest.mocked(assertOrderSizeLimit).mockReset().mockResolvedValue(undefined);
});

it("checks the exact atomic sell amount before allowing review", async () => {
  let finish!: () => void;
  jest.mocked(assertOrderSizeLimit).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const { result } = renderHook(() => useOrderSizeLimit(input), { wrapper });
  expect(result.current).toBe("checking");
  expect(assertOrderSizeLimit).toHaveBeenCalledWith({
    chainId: 1,
    tokenSell: token,
    sellAmount: BigInt("1000000000000000000"),
  });
  await act(async () => finish());
  await waitFor(() => expect(result.current).toBe("allowed"));
});

it("accepts a decimal without a leading zero", async () => {
  const { result } = renderHook(
    () => useOrderSizeLimit({ ...input, sellAmount: ".5" }),
    { wrapper },
  );
  await waitFor(() => expect(result.current).toBe("allowed"));
  expect(assertOrderSizeLimit).toHaveBeenCalledWith({
    chainId: 1,
    tokenSell: token,
    sellAmount: BigInt("500000000000000000"),
  });
});

it.each([
  [ORDER_SIZE_LIMIT_EXCEEDED_ERROR, "over"],
  ["RPC unavailable", "unavailable"],
])("fails closed for %s", async (message, status) => {
  jest.mocked(assertOrderSizeLimit).mockRejectedValue(new Error(message));
  const { result } = renderHook(() => useOrderSizeLimit(input), { wrapper });
  await waitFor(() => expect(result.current).toBe(status));
});

it.each(["", "0", "-1", "1e3", "bad", "0.0000000000000000001"])(
  "does not fetch or allow an invalid amount %s",
  (sellAmount) => {
    const { result } = renderHook(
      () => useOrderSizeLimit({ ...input, sellAmount }),
      { wrapper },
    );
    expect(result.current).toBe("unavailable");
    expect(assertOrderSizeLimit).not.toHaveBeenCalled();
  },
);

it.each(["amount", "token", "decimals", "chain"])(
  "does not reuse an allowed result when the %s changes",
  async (field) => {
    const { result, rerender } = renderHook(
      (props) => useOrderSizeLimit(props),
      { initialProps: input, wrapper },
    );
    await waitFor(() => expect(result.current).toBe("allowed"));
    jest.mocked(assertOrderSizeLimit).mockReturnValue(new Promise(() => {}));
    rerender({
      chainId: field === "chain" ? 100 : 1,
      sellAmount: field === "amount" ? "2" : "1",
      tokenSell: {
        ...token,
        decimals: field === "decimals" ? 6 : token.decimals,
        address:
          field === "token"
            ? "0x2222222222222222222222222222222222222222"
            : token.address,
      },
    });
    expect(result.current).toBe("checking");
    await waitFor(() => expect(assertOrderSizeLimit).toHaveBeenCalledTimes(2));
    expect(result.current).toBe("checking");
  },
);

it("ignores an earlier result after the amount changes", async () => {
  let finish!: () => void;
  jest
    .mocked(assertOrderSizeLimit)
    .mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    )
    .mockRejectedValue(new Error(ORDER_SIZE_LIMIT_EXCEEDED_ERROR));
  const { result, rerender } = renderHook((props) => useOrderSizeLimit(props), {
    initialProps: input,
    wrapper,
  });
  rerender({ ...input, sellAmount: "2" });
  await waitFor(() => expect(result.current).toBe("over"));
  await act(async () => finish());
  expect(result.current).toBe("over");
});
