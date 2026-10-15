import type { Bar } from "./types";

type BarOverrides = Partial<Omit<Bar, "date">>;

/** Builds daily bars from closes; each bar opens at the previous close with a ±1% wick. */
export function barsFromCloses(closes: number[], { volume = 1_000_000 }: { volume?: number } = {}): Bar[] {
  return closes.map((close, index) => {
    const open = index === 0 ? close : closes[index - 1];
    const date = new Date(Date.UTC(2025, 0, 1) + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      date,
      open,
      high: Math.max(open, close) * 1.01,
      low: Math.min(open, close) * 0.99,
      close,
      volume,
    };
  });
}

export function withLast(bars: Bar[], overrides: BarOverrides) {
  return [...bars.slice(0, -1), { ...bars[bars.length - 1], ...overrides }];
}

export const geometric = (start: number, dailyRate: number, length: number) =>
  Array.from({ length }, (_, index) => start * (1 + dailyRate) ** index);
