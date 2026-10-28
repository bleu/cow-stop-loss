/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { configuredChainMaxAgeSeconds } from "#/lib/oracleRouter";
import { VALID_TO_OPTIONS } from "#/lib/schema";
import type { SwapData } from "#/lib/types";

import { AdvancedSettingsPanel } from "../AdvancedSettingsPanel";

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({
    address: "0x1111111111111111111111111111111111111111",
    chainId: 1,
  }),
}));

function SettingsForm() {
  const [open, setOpen] = useState(false);
  const form = useForm<SwapData>({
    defaultValues: {
      validTo: VALID_TO_OPTIONS.DAY,
      slippagePercent: "0.25",
      limitPrice: "1234",
      limitPriceSource: "price",
    },
  });

  return (
    <FormProvider {...form}>
      <input
        aria-label="Protection slippage"
        {...form.register("slippagePercent")}
      />
      <input aria-label="Limit price" {...form.register("limitPrice")} />
      <input
        aria-label="Limit price source"
        {...form.register("limitPriceSource")}
      />
      <AdvancedSettingsPanel
        open={open}
        onOpenChange={setOpen}
        title={<h2>Stop-loss order</h2>}
        orderTiming={
          <label>
            Expiry
            <select {...form.register("validTo")}>
              <option value={VALID_TO_OPTIONS.DAY}>1 day</option>
              <option value={VALID_TO_OPTIONS.DAYS_7}>7 days</option>
            </select>
          </label>
        }
      />
    </FormProvider>
  );
}

beforeEach(() => {
  useAdvancedSettingsStore.getState().resetAdvancedSettings();
});

it("shows expiry and advanced fields without slippage controls", async () => {
  const user = userEvent.setup();
  render(<SettingsForm />);

  await user.click(screen.getByRole("button", { name: "Order settings" }));

  expect(screen.getByRole("group", { name: "Order timing" })).toContainElement(
    screen.getByRole("combobox", { name: "Expiry" }),
  );
  const advanced = within(
    screen.getByRole("group", { name: "Advanced order settings" }),
  );
  expect(
    advanced.getByRole("spinbutton", { name: "Maximum oracle age (hours)" }),
  ).toBeVisible();
  expect(advanced.getByRole("combobox", { name: "Execution" })).toBeVisible();
  expect(advanced.getByRole("textbox", { name: "Receiver" })).toBeVisible();
  expect(
    advanced.queryByRole("textbox", { name: /slippage/i }),
  ).not.toBeInTheDocument();
  expect(
    advanced.queryByRole("button", { name: /auto/i }),
  ).not.toBeInTheDocument();
});

it("spreads free space between settings fields and actions", async () => {
  const user = userEvent.setup();
  render(<SettingsForm />);

  await user.click(screen.getByRole("button", { name: "Order settings" }));

  expect(screen.getByRole("region", { name: "Order settings" })).toHaveClass(
    "justify-between",
    "gap-4",
  );
  expect(
    screen.getByRole("group", { name: "Advanced order settings" }),
  ).toHaveClass("contents");
  expect(
    screen.getByRole("button", { name: "Return to order" }).parentElement,
  ).not.toHaveClass("mt-auto");
});

it("keeps expiry when the panel closes and opens again", async () => {
  const user = userEvent.setup();
  render(<SettingsForm />);

  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Expiry" }),
    VALID_TO_OPTIONS.DAYS_7,
  );
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Order timing" }),
    ).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));

  expect(screen.getByRole("combobox", { name: "Expiry" })).toHaveValue(
    VALID_TO_OPTIONS.DAYS_7,
  );
});

it("saves valid advanced edits without copying protection fields", async () => {
  const user = userEvent.setup();
  render(<SettingsForm />);

  await user.click(screen.getByRole("button", { name: "Order settings" }));
  const oracleAge = screen.getByRole("spinbutton", {
    name: "Maximum oracle age (hours)",
  });
  await user.clear(oracleAge);
  await user.type(oracleAge, "1");

  await waitFor(() => {
    const { advancedSettings, oracleAgeMode } =
      useAdvancedSettingsStore.getState();
    expect(Number(advancedSettings.maxHoursSinceOracleUpdates)).toBe(1);
    expect(Object.keys(advancedSettings).sort()).toEqual(
      Object.keys(defaultAdvancedSettings).sort(),
    );
    expect(oracleAgeMode).toBe("explicit");
  });
  expect(
    screen.getByRole("textbox", { name: "Protection slippage" }),
  ).toHaveValue("0.25");
  expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
    "1234",
  );
});

it("resets only advanced settings and keeps expiry and protection values", async () => {
  useAdvancedSettingsStore.getState().setAdvancedSettings({
    receiver: "0x2222222222222222222222222222222222222222",
    maxHoursSinceOracleUpdates: 1,
    partiallyFillable: true,
  });
  const user = userEvent.setup();
  render(<SettingsForm />);

  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Expiry" }),
    VALID_TO_OPTIONS.DAYS_7,
  );
  await user.click(
    screen.getByRole("button", { name: "Reset to default settings" }),
  );

  await waitFor(() => {
    expect(useAdvancedSettingsStore.getState().advancedSettings).toEqual(
      defaultAdvancedSettings,
    );
    expect(useAdvancedSettingsStore.getState().oracleAgeMode).toBe("automatic");
    expect(
      screen.getByRole("button", { name: "Order settings" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
  expect(
    screen.getByRole("textbox", { name: "Protection slippage" }),
  ).toHaveValue("0.25");
  expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
    "1234",
  );
  expect(
    screen.getByRole("textbox", { name: "Limit price source" }),
  ).toHaveValue("price");

  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("combobox", { name: "Expiry" })).toHaveValue(
    VALID_TO_OPTIONS.DAYS_7,
  );
  expect(
    screen.getByRole("spinbutton", { name: "Maximum oracle age (hours)" }),
  ).toHaveValue(
    Math.min(
      defaultAdvancedSettings.maxHoursSinceOracleUpdates,
      configuredChainMaxAgeSeconds(1) / 3600,
    ),
  );
  expect(screen.getByRole("combobox", { name: "Execution" })).toHaveTextContent(
    "Fill or kill",
  );
  expect(screen.getByRole("textbox", { name: "Receiver" })).toHaveValue("");
  expect(
    screen.getByRole("button", { name: "Order settings" }),
  ).not.toHaveClass("text-primary");
});
