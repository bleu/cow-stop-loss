/** @jest-environment jsdom */

import { render } from "@testing-library/react";
import React from "react";

import { PixelIcon, type PixelIconName } from "#/components/ui/pixel-icon";

const interfaceIcons: PixelIconName[] = [
  "external-link",
  "arrow-left",
  "arrow-right",
  "chevron-left",
  "chevron-right",
  "chevron-up",
  "chevron-down",
  "chevrons-left",
  "chevrons-right",
  "sun",
  "moon",
  "github",
  "discord",
  "play",
  "pause",
  "close",
  "check-circle",
  "cancel-circle",
  "clock",
  "sort",
  "info",
  "question",
  "warning",
  "trash",
  "settings",
  "reload",
  "filter",
  "wallet",
  "copy",
  "check",
];

it.each(interfaceIcons)(
  "renders %s on the shared decorative pixel grid",
  (name) => {
    const { container } = render(<PixelIcon name={name} className="size-4" />);
    const icon = container.querySelector("svg");

    expect(icon).toHaveAttribute("data-pixel-icon", name);
    expect(icon).toHaveAttribute("viewBox", "0 0 16 16");
    expect(icon).toHaveAttribute("fill", "currentColor");
    expect(icon).toHaveAttribute("shape-rendering", "crispEdges");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    expect(icon).toHaveClass("size-4");
    expect(icon?.querySelector("path")?.getAttribute("d")).toBeTruthy();
    expect(icon?.querySelector("path")).not.toHaveAttribute("stroke");
  },
);
