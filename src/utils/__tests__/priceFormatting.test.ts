import { formatMarketPriceForInput } from "../priceFormatting";

test("limits market price inputs to four decimal places", () => {
  expect(formatMarketPriceForInput(2451.4263)).toBe("2451.4263");
  expect(formatMarketPriceForInput(2451.4)).toBe("2451.4");
});

test("uses adaptive precision for small market prices", () => {
  expect(formatMarketPriceForInput(0.00001234)).toBe("0.000012");
  expect(formatMarketPriceForInput(0.00000001)).toBe("0.00000001");
  expect(formatMarketPriceForInput(1e-22)).toBe("0.0000000000000000000001");
});
