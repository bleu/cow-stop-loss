/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";

import { NetworkLogo } from "#/components/NetworkLogo";
import { cowprotocolTokenLogoUrl,TokenLogo } from "#/components/TokenLogo";
import { CHAIN_INFO } from "#/lib/chainInfo";
import { supportedChains } from "#/lib/publicClients";
import { TOKEN_CATALOG } from "#/lib/tokenCatalog";

it.each(supportedChains)("uses the local chain image for $name", (chain) => {
  const { container } = render(<NetworkLogo chainId={chain.id} />);
  expect(container.querySelector("img")).toHaveAttribute(
    "src",
    CHAIN_INFO[chain.id].icon,
  );
});

it("uses catalog images for every token without symbol restrictions", () => {
  const view = render(<TokenLogo alt="Token" width={24} height={24} />);
  for (const token of TOKEN_CATALOG) {
    view.rerender(
      <TokenLogo
        tokenAddress={token.address.toUpperCase().replace("0X", "0x")}
        chainId={token.chainId}
        alt="Token"
        width={24}
        height={24}
      />,
    );
    expect(screen.getByRole("img", { name: "Token" })).toHaveAttribute(
      "src",
      expect.stringContaining(token.logoURI),
    );
  }
});

it("keeps remote and generic fallbacks for historical tokens", () => {
  const address = "0x1111111111111111111111111111111111111111";
  render(
    <TokenLogo
      tokenAddress={address}
      chainId={100}
      alt="Historical token"
      width={24}
      height={24}
    />,
  );
  const image = screen.getByRole("img", { name: "Historical token" });
  expect(image).toHaveAttribute("src", cowprotocolTokenLogoUrl(address, 100));
  for (let attempt = 0; attempt < 12; attempt++) fireEvent.error(image);
  expect(image).toHaveAttribute(
    "src",
    expect.stringContaining("/assets/generic-token-logo.png"),
  );
});

it("starts from the local image when the token changes after a fallback", () => {
  const view = render(
    <TokenLogo
      tokenAddress="0x1111111111111111111111111111111111111111"
      chainId={100}
      alt="Token"
      width={24}
      height={24}
    />,
  );
  fireEvent.error(screen.getByRole("img", { name: "Token" }));
  const token = TOKEN_CATALOG[0];
  view.rerender(
    <TokenLogo
      tokenAddress={token.address}
      chainId={token.chainId}
      alt="Token"
      width={24}
      height={24}
    />,
  );
  expect(screen.getByRole("img", { name: "Token" })).toHaveAttribute(
    "src",
    expect.stringContaining(token.logoURI),
  );
});

it.each([undefined, "", "invalid"])(
  "handles a missing or invalid token address %s",
  (tokenAddress) => {
    render(
      <TokenLogo
        tokenAddress={tokenAddress}
        chainId={1}
        alt="Token"
        width={24}
        height={24}
      />,
    );
    expect(screen.getByRole("img", { name: "Token" })).toHaveAttribute(
      "src",
      expect.stringContaining("/assets/generic-token-logo.png"),
    );
  },
);
