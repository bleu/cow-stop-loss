type Amount = string | number;

type DecimalAmount = {
  units: bigint;
  scale: number;
};

function decimalAmount(value: Amount): DecimalAmount | undefined {
  const match = String(value)
    .trim()
    .match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
  if (!match || (!match[2] && !match[3])) return undefined;
  const fraction = match[3] ?? "";
  const scale = fraction.length - Number(match[4] ?? 0);
  const units = BigInt(`${match[1]}${match[2] || "0"}${fraction}`);
  return scale < 0
    ? { units: units * 10n ** BigInt(-scale), scale: 0 }
    : { units, scale };
}

function atMost(amount: DecimalAmount, units: bigint, scale = 0) {
  const magnitude = amount.units < 0n ? -amount.units : amount.units;
  return (
    magnitude * 10n ** BigInt(scale) <= units * 10n ** BigInt(amount.scale)
  );
}

// Matches https://github.com/cowprotocol/cowswap/tree/develop/libs/common-utils/src/amountFormat.
function precisionForAmount(amount: DecimalAmount, decimals?: number) {
  const precision = atMost(amount, 1n, 8)
    ? 18
    : atMost(amount, 1n, 5)
      ? 12
      : atMost(amount, 1n)
        ? 6
        : atMost(amount, 100_000n)
          ? 4
          : atMost(amount, 1_000_000n)
            ? 3
            : atMost(amount, 10_000_000n)
              ? 2
              : 3;
  return decimals === undefined ? precision : Math.min(decimals, precision);
}

export function getPrecisionForAmount(value: Amount, decimals?: number) {
  const amount = decimalAmount(value);
  return amount ? precisionForAmount(amount, decimals) : 0;
}

function roundedAmount(amount: DecimalAmount, precision: number) {
  if (amount.scale <= precision) {
    return amount.units * 10n ** BigInt(precision - amount.scale);
  }
  const divisor = 10n ** BigInt(amount.scale - precision);
  const magnitude = amount.units < 0n ? -amount.units : amount.units;
  const rounded = (magnitude + divisor / 2n) / divisor;
  return amount.units < 0n ? -rounded : rounded;
}

function exactAmount(units: bigint, scale: number, grouped = false): string {
  const negative = units < 0n;
  const digits = (negative ? -units : units)
    .toString()
    .padStart(scale + 1, "0");
  const whole = scale ? digits.slice(0, -scale) : digits;
  const fraction = scale ? digits.slice(-scale).replace(/0+$/, "") : "";
  return `${negative ? "-" : ""}${grouped ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole}${fraction ? `.${fraction}` : ""}`;
}

function formatAmount(amount: DecimalAmount, precision: number) {
  if (amount.units === 0n) return "0";
  const divisor = 10n ** BigInt(amount.scale);
  const suffixScale =
    amount.units >= 1_000_000_000_000n * divisor
      ? 12
      : amount.units >= 1_000_000_000n * divisor
        ? 9
        : 0;
  const rounded = roundedAmount(
    { ...amount, scale: amount.scale + suffixScale },
    precision,
  );
  if (amount.units > 0n && rounded === 0n) {
    return `< 0.${"0".repeat((precision || 4) - 1)}1`;
  }
  return `${exactAmount(rounded, precision, true)}${suffixScale === 12 ? "T" : suffixScale === 9 ? "B" : ""}`;
}

export function formatTokenAmount(value: Amount, decimals?: number): string {
  const amount = decimalAmount(value);
  return amount
    ? formatAmount(amount, precisionForAmount(amount, decimals))
    : "";
}

export function formatFiatAmount(value: Amount): string {
  const amount = decimalAmount(value);
  return amount ? formatAmount(amount, 2) : "";
}

export function formatInputAmount(
  value: Amount,
  decimals?: number,
  preserveExact = false,
): string {
  const amount = decimalAmount(value);
  if (!amount) return "";
  if (preserveExact) return exactAmount(amount.units, amount.scale);
  const precision = precisionForAmount(amount, decimals);
  const rounded = roundedAmount(amount, precision);
  if (rounded !== 0n || amount.units === 0n) {
    return exactAmount(rounded, precision);
  }
  const magnitude = amount.units < 0n ? -amount.units : amount.units;
  const significantPrecision = Math.max(
    0,
    amount.scale - magnitude.toString().length + 4,
  );
  return exactAmount(
    roundedAmount(amount, significantPrecision),
    significantPrecision,
  );
}
