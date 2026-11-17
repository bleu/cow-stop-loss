/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";

import TermsPage from "#/app/terms/page";

test("lets a visitor read the terms summary without connecting a wallet", () => {
  render(<TermsPage />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Terms of use" }),
  ).toBeVisible();
  expect(screen.getByText(/Last updated:/)).toHaveTextContent(
    "Last updated: 2026-11-17",
  );
  const summary = screen.getByRole("region", { name: "Summary (TL;DR)" });
  expect(summary).toHaveAttribute("id", "summary");
  expect(within(summary).getAllByRole("listitem")).toHaveLength(7);
  expect(summary).toHaveTextContent(
    'CoW Air Rescue is experimental and provided "as is", without warranty.',
  );
  expect(summary).toHaveTextContent(
    "We never hold your funds or private keys.",
  );
  expect(summary).toHaveTextContent(
    "By using the interface, you agree to these Terms.",
  );
  expect(
    screen.queryByRole("button", { name: /connect/i }),
  ).not.toBeInTheDocument();
});

test("provides the complete terms with linked risks, fees, privacy, and contact disclosures", () => {
  render(<TermsPage />);

  expect(
    screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent),
  ).toEqual([
    "Summary (TL;DR)",
    "1. About these Terms",
    "2. What the Interface does, and what it does not do",
    "3. Beta status",
    "4. Eligibility",
    "5. How stop-loss orders work",
    "6. Risks",
    "7. Fees",
    "8. No advice and default settings",
    "9. Your responsibilities",
    "10. Privacy and data",
    "11. Third-party services",
    "12. Open source",
    "13. Disclaimer of warranties",
    "14. Limitation of liability",
    "15. Changes",
    "16. Contact",
  ]);
  for (const [id, name] of [
    ["risks", "6. Risks"],
    ["fees", "7. Fees"],
    ["privacy", "10. Privacy and data"],
    ["contact", "16. Contact"],
  ]) {
    expect(screen.getByRole("region", { name })).toHaveAttribute("id", id);
    expect(
      screen.getByRole("link", { name: new RegExp(`^${id}$`, "i") }),
    ).toHaveAttribute("href", `#${id}`);
  }
  const risks = screen.getByRole("region", { name: "6. Risks" });
  expect(within(risks).getAllByRole("listitem")).toHaveLength(14);
  expect(risks).toHaveTextContent(
    "CoW Protocol contracts have undergone audits.",
  );
  expect(risks).toHaveTextContent("Audits reduce risk but do not remove it.");
  expect(
    within(risks).getByRole("link", { name: "CoW Protocol" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/cowprotocol/contracts/tree/main/audits",
  );
  expect(
    within(risks).getByRole("link", { name: "Composable CoW" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/cowprotocol/composable-cow/tree/main/audits",
  );
  const privacy = screen.getByRole("region", { name: "10. Privacy and data" });
  expect(privacy).toHaveTextContent(
    "Analytics is enabled by default when configured.",
  );
  expect(privacy).toHaveTextContent("PostHog (hosted in the US)");
  expect(privacy).toHaveTextContent("your wallet address once connected");
  expect(privacy).toHaveTextContent("Analytics preferences");
  expect(privacy).not.toHaveTextContent(
    /nothing before you consent|with your consent/i,
  );
  expect(screen.getByRole("link", { name: "MIT license" })).toHaveAttribute(
    "href",
    "https://github.com/bleu/cow-stop-loss/blob/main/LICENSE",
  );
  expect(screen.getByRole("main")).not.toHaveTextContent(
    /\[(?:LICENSE|AUDIT STATUS|Confirmar)/,
  );
});
