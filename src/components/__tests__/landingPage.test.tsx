/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";

import LandingPageRoute from "#/app/page";

it("shows the landing page and links to the trading app without a wallet", () => {
  render(<LandingPageRoute />);

  expect(
    screen.getByRole("heading", { level: 1, name: /a plan for the way down/i }),
  ).toBeVisible();
  const links = screen.getAllByRole("link", { name: "Open app" });
  expect(links).toHaveLength(2);
  for (const link of links) expect(link).toHaveAttribute("href", "/app");
  expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute(
    "href",
    "#how-it-works",
  );
  expect(screen.queryByRole("button", { name: /connect wallet/i })).toBeNull();
});

it("provides an addressable FAQ with expandable technical answers", () => {
  render(<LandingPageRoute />);

  const faq = screen.getByRole("region", {
    name: "Frequently asked questions",
  });
  expect(faq).toHaveAttribute("id", "faq");

  const oracleQuestion = within(faq).getByRole("button", {
    name: "Which oracles are used, and what should I check?",
  });
  expect(oracleQuestion).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(oracleQuestion);
  expect(oracleQuestion).toHaveAttribute("aria-expanded", "true");
  expect(within(faq).getByText(/There is no custom-feed picker/)).toBeVisible();
  expect(within(faq).getByText(/assumes WBTC tracks BTC 1:1/)).toBeVisible();
  fireEvent.click(oracleQuestion);
  expect(oracleQuestion).toHaveAttribute("aria-expanded", "false");
});

it("keeps execution details without a separate disclosures section", () => {
  render(<LandingPageRoute />);

  expect(
    screen.queryByRole("heading", { name: "Risks and legal disclosures" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      /This app creates orders. CoW Protocol is responsible for execution/,
    ),
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: /Read the Composable CoW docs/i }),
  ).toHaveAttribute(
    "href",
    "https://docs.cow.fi/cow-protocol/reference/contracts/periphery/composable-cow",
  );
});
