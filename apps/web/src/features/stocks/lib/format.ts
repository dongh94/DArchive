export type Currency = "KRW" | "USD";

export function formatPrice(value: number, currency: Currency) {
  return currency === "USD"
    ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatSignedPrice(value: number, currency: Currency) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatPrice(Math.abs(value), currency)}`;
}

/** Toss reports market caps in KRW for every market. */
export function formatMarketCap(value: number) {
  const eok = value / 100_000_000;
  return eok >= 10_000 ? `${(eok / 10_000).toFixed(1)}조` : `${Math.round(eok).toLocaleString("ko-KR")}억`;
}

export function formatSignedPercent(ratio: number) {
  const percent = ratio * 100;
  return `${percent > 0 ? "+" : ""}${percent.toFixed(2)}%`;
}

/** Korean market convention: red for gains, blue for losses. */
export const changeColorClass = (value: number) => (value > 0 ? "text-[#f04452]" : value < 0 ? "text-[#3182f6]" : "text-[#8b95a1]");
