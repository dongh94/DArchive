import type { Bar, Currency, StrategyCheck } from "./types";

/**
 * All helpers take `offset` = how many bars back from the latest bar the window ends,
 * so `sma(closes, 200, 21)` is the 200-day average as of one month ago.
 */
function windowOf(values: number[], period: number, offset = 0) {
  const end = values.length - offset;
  const start = end - period;

  return start < 0 || end > values.length ? null : values.slice(start, end);
}

export function sma(values: number[], period: number, offset = 0) {
  const window = windowOf(values, period, offset);
  return window ? window.reduce((sum, value) => sum + value, 0) / period : null;
}

export function highest(values: number[], period: number, offset = 0) {
  const window = windowOf(values, period, offset);
  return window ? Math.max(...window) : null;
}

export function lowest(values: number[], period: number, offset = 0) {
  const window = windowOf(values, period, offset);
  return window ? Math.min(...window) : null;
}

export function averageTrueRange(bars: Bar[], period: number) {
  if (bars.length < period + 1) {
    return null;
  }

  const trueRanges = bars.slice(-period).map((bar, index) => {
    const previousClose = bars[bars.length - period - 1 + index].close;
    return Math.max(bar.high - bar.low, Math.abs(bar.high - previousClose), Math.abs(bar.low - previousClose));
  });

  return trueRanges.reduce((sum, value) => sum + value, 0) / period;
}

export function averageTurnover(bars: Bar[], period: number) {
  return sma(bars.map((bar) => bar.close * bar.volume), period);
}

export function percentChange(values: number[], period: number) {
  if (values.length <= period) {
    return null;
  }

  const base = values[values.length - 1 - period];
  return base > 0 ? values[values.length - 1] / base - 1 : null;
}

/** IBD-style weighting: the latest quarter counts double. */
export function relativeStrengthScore(closes: number[]) {
  const quarters = [63, 126, 189, 252].map((period) => percentChange(closes, period));

  if (quarters.some((value) => value === null)) {
    return null;
  }

  const [q1, q2, q3, q4] = quarters as number[];
  return 0.4 * q1 + 0.2 * q2 + 0.2 * q3 + 0.2 * q4;
}

/** Maps raw scores to 1–99 percentile ratings. */
export function toPercentileRatings(scores: Map<string, number>) {
  const sorted = [...scores.entries()].sort((a, b) => a[1] - b[1]);
  const ratings = new Map<string, number>();

  sorted.forEach(([symbol], index) => {
    ratings.set(symbol, sorted.length === 1 ? 99 : Math.max(1, Math.round((index / (sorted.length - 1)) * 99)));
  });

  return ratings;
}

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function priceFormatter(currency: Currency) {
  return currency === "USD"
    ? (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export const formatPercent = (ratio: number, digits = 1) => `${(ratio * 100).toFixed(digits)}%`;

export function check(
  key: string,
  label: string,
  passed: boolean,
  value: string,
  threshold: string,
  required = true,
): StrategyCheck {
  return { key, label, passed, required, value, threshold };
}

export const allRequiredPassed = (checks: StrategyCheck[]) => checks.every((item) => !item.required || item.passed);

/** Weighted share of passed checks; required checks weigh twice as much as optional ones. */
export function checkScore(checks: StrategyCheck[]) {
  const total = checks.reduce((sum, item) => sum + (item.required ? 2 : 1), 0);
  const passed = checks.reduce((sum, item) => sum + (item.passed ? (item.required ? 2 : 1) : 0), 0);

  return total === 0 ? 0 : passed / total;
}

export const closesOf = (bars: Bar[]) => bars.map((bar) => bar.close);
export const highsOf = (bars: Bar[]) => bars.map((bar) => bar.high);
export const lowsOf = (bars: Bar[]) => bars.map((bar) => bar.low);
export const volumesOf = (bars: Bar[]) => bars.map((bar) => bar.volume);
