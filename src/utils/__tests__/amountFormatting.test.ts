import {
  formatFiatAmount,
  formatInputAmount,
  formatTokenAmount,
  getPrecisionForAmount,
} from "../amountFormatting";

describe("CoW amount formatting", () => {
  test.each([
    ["0.00000001", 18],
    ["0.000000010000000001", 12],
    ["0.00001", 12],
    ["0.000010000000000001", 6],
    ["1", 6],
    ["1.000000000000000001", 4],
    ["100000", 4],
    ["100000.000001", 3],
    ["1000000", 3],
    ["1000000.000001", 2],
    ["10000000", 2],
    ["10000000.000001", 3],
  ])("selects precision for %s", (value, precision) => {
    expect(getPrecisionForAmount(value)).toBe(precision);
  });

  test.each([
    ["94.544269912", "94.5443"],
    ["0", "0"],
    ["1.0000", "1"],
    ["94.54425", "94.5443"],
    ["94.99999", "95"],
    ["99999.99999", "100,000"],
    ["0.0000123456789", "0.000012"],
    ["0.00000123456789", "0.000001234568"],
    ["1e-8", "0.00000001"],
    ["1e-19", "< 0.000000000000000001"],
    ["999999999.5", "999,999,999.5"],
    ["1000000000", "1B"],
    ["1234567890", "1.235B"],
    ["1000000000000", "1T"],
    ["9007199254740993123456", "9,007,199,254.741T"],
  ])("formats token amount %s", (value, formatted) => {
    expect(formatTokenAmount(value)).toBe(formatted);
  });

  test("limits token quantities to their token decimals", () => {
    expect(getPrecisionForAmount("0.00000001", 6)).toBe(6);
    expect(formatTokenAmount("0.123456789", 6)).toBe("0.123457");
    expect(formatTokenAmount("1.5", 0)).toBe("2");
    expect(formatTokenAmount("0.00000001", 6)).toBe("< 0.000001");
  });

  test.each([
    ["2634.10", "2,634.1"],
    ["0", "0"],
    ["0.004", "< 0.01"],
    ["0.005", "0.01"],
    ["99.999", "100"],
  ])("formats fiat amount %s", (value, formatted) => {
    expect(formatFiatAmount(value)).toBe(formatted);
  });

  test("formats calculated inputs without grouping or suffixes", () => {
    expect(formatInputAmount("1234567890")).toBe("1234567890");
    expect(formatInputAmount("94.544269912")).toBe("94.5443");
    expect(formatInputAmount("1.23456789e-22")).toBe(
      "0.0000000000000000000001235",
    );
  });

  test("preserves independent and MAX input precision", () => {
    const exact = "9007199254740993.123456789012345678";
    expect(formatInputAmount(exact, 18, true)).toBe(exact);
    expect(formatInputAmount("1.23000", 18, true)).toBe("1.23");
  });

  test.each(["", "invalid", "NaN", "Infinity"])("rejects %s", (value) => {
    expect(formatTokenAmount(value)).toBe("");
    expect(formatFiatAmount(value)).toBe("");
    expect(formatInputAmount(value)).toBe("");
  });
});
