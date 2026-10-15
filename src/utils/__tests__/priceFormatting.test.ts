import { formatMarketPriceForInput } from "../priceFormatting";

test("limits market price inputs to four decimal places", () => {
  expect(formatMarketPriceForInput(2451.4263)).toBe("2451.4263");
  expect(formatMarketPriceForInput(2451.4)).toBe("2451.4");
});

test("keeps very small market prices above zero", () => {
  expect(formatMarketPriceForInput(0.00001234)).toBe("0.00001234");
});
