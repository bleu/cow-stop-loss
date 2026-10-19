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

it("keeps one decorative cow beside the hero copy", () => {
  render(<LandingPageRoute />);

  const hero = screen.getByRole("region", { name: /a plan for the way down/i });
  const scene = hero.querySelector(".landing-scene");
  expect(scene).toHaveAttribute("aria-hidden", "true");
  expect(scene?.querySelectorAll(".landing-passenger")).toHaveLength(1);
  expect(scene?.querySelector(".rescue-landing-art")).toBeNull();
});

it("illustrates each step without adding spoken content or controls", () => {
  const { container } = render(<LandingPageRoute />);
  const section = screen.getByRole("region", { name: "How it works" });
  const cards = within(section).getAllByRole("listitem");
  const titles = [
    "Set your plan",
    "Check before signing",
    "Execution through CoW",
  ];
  const scenes = ["plan", "review", "execution"];

  expect(cards).toHaveLength(3);
  cards.forEach((card, index) => {
    expect(
      within(card).getByRole("heading", { level: 3, name: titles[index] }),
    ).toBeVisible();
    const scene = card.querySelector(`.landing-step-scene-${scenes[index]}`);
    expect(scene).toHaveAttribute("aria-hidden", "true");
    expect(scene).toHaveTextContent(`0${index + 1}`);
    expect(scene?.querySelector("a, button, input, [tabindex]")).toBeNull();
  });
  expect(container.querySelector(".landing-rig")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(
    screen.getByText(/Execution and price are not guaranteed/),
  ).toBeVisible();
  expect(
    within(cards[2]).getByText(/if the order can be filled within its terms/),
  ).toBeVisible();
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
  expect(
    within(faq).getByText(/configured ETH or USD price-feed route/),
  ).toBeVisible();
  expect(
    within(faq).getByText(/ETH feeds when both configured tokens have them/),
  ).toBeVisible();
  fireEvent.click(oracleQuestion);
  expect(oracleQuestion).toHaveAttribute("aria-expanded", "false");

  const networkQuestion = within(faq).getByRole("button", {
    name: "Which tokens and networks can I use?",
  });
  fireEvent.click(networkQuestion);
  expect(
    within(faq).getByText(/BNB Chain, Linea, Plasma, and Sepolia/),
  ).toBeVisible();
  expect(
    within(faq).getByText(/approved oracle routes depend on the network/),
  ).toBeVisible();
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
