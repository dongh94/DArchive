import type { TopPick } from "./types";

/** Latest close and its change versus the previous session, taken from the chart series. */
export function getPriceStats(pick: TopPick) {
  const closes = pick.chart?.closes ?? [];
  const close = closes.at(-1) ?? null;
  const previous = closes.at(-2) ?? null;

  if (close === null || previous === null || previous === 0) {
    return { close, change: 0, changeRatio: 0 };
  }

  return { close, change: close - previous, changeRatio: close / previous - 1 };
}
