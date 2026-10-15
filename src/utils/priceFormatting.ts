export function formatMarketPriceForInput(price: number) {
  const fourDecimals = price.toFixed(4).replace(/\.?0+$/, "");
  if (Number(fourDecimals) > 0) return fourDecimals;

  return price.toFixed(18).replace(/\.?0+$/, "");
}
