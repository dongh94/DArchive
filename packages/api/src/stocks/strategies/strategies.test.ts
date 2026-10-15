import { describe, expect, it } from "vitest";
import { granvillePullbackStrategy } from "./granville-pullback";
import { averageTrueRange, checkScore, highest, priceFormatter, relativeStrengthScore, sma, toPercentileRatings } from "./indicators";
import { sepaStrategy } from "./sepa";
import { barsFromCloses, geometric, withLast } from "./test-fixtures";
import { findDarvasBox, turtleDarvasStrategy } from "./turtle-darvas";
import { volatilityBreakoutStrategy } from "./volatility-breakout";
import { selectPicks } from "../run-strategies";

const failedKeys = (checks: { key: string; passed: boolean }[]) => checks.filter((item) => !item.passed).map((item) => item.key);

describe("indicators", () => {
  it("computes moving averages and extremes with an offset from the latest bar", () => {
    const values = [1, 2, 3, 4, 5, 6];

    expect(sma(values, 3)).toBe(5);
    expect(sma(values, 3, 1)).toBe(4);
    expect(sma(values, 7)).toBeNull();
    expect(highest(values, 2, 2)).toBe(4);
  });

  it("averages true range including gaps from the previous close", () => {
    const bars = barsFromCloses([100, 100, 100]).map((bar) => ({ ...bar, high: bar.close + 1, low: bar.close - 1 }));
    bars[2] = { ...bars[2], open: 110, high: 112, low: 108, close: 110 };

    expect(averageTrueRange(bars, 2)).toBe((2 + 12) / 2);
  });

  it("needs a full year of closes for relative strength and ranks scores into 1–99", () => {
    expect(relativeStrengthScore(geometric(100, 0.001, 200))).toBeNull();
    expect(relativeStrengthScore(geometric(100, 0.001, 253))).toBeGreaterThan(0);

    const ratings = toPercentileRatings(new Map([["a", -0.2], ["b", 0.1], ["c", 0.5]]));
    expect([ratings.get("a"), ratings.get("b"), ratings.get("c")]).toEqual([1, 50, 99]);
  });

  it("weighs required checks twice as much as optional ones", () => {
    const base = { label: "", value: "", threshold: "" };

    expect(
      checkScore([
        { ...base, key: "a", passed: true, required: true },
        { ...base, key: "b", passed: false, required: false },
      ]),
    ).toBeCloseTo(2 / 3);
  });
});

describe("SEPA trend template", () => {
  it("accepts a steady stage-2 uptrend with strong relative strength", () => {
    const result = sepaStrategy.buy.evaluate(barsFromCloses(geometric(10_000, 0.004, 300)), { rsRating: 92, currency: "KRW" });

    expect(failedKeys(result.checks.filter((item) => item.required))).toEqual([]);
    expect(result.eligible).toBe(true);
    expect(result.levels?.stop).toBeLessThan(result.levels?.entry ?? 0);
  });

  it("rejects a downtrend and weak relative strength", () => {
    const result = sepaStrategy.buy.evaluate(barsFromCloses(geometric(10_000, -0.002, 300)), { rsRating: 20, currency: "KRW" });

    expect(result.eligible).toBe(false);
    expect(failedKeys(result.checks)).toEqual(expect.arrayContaining(["above-150-200", "ma200-rising", "rs"]));
  });
});

describe("volatility breakout", () => {
  it("prefers trending bars that close near their highs", () => {
    const bars = geometric(10_000, 0.005, 40).map((close, index) => ({
      date: `2025-02-${String(index + 1).padStart(2, "0")}`,
      open: close * 0.97,
      high: close * 1.005,
      low: close * 0.965,
      close,
      volume: 1_000_000,
    }));
    const result = volatilityBreakoutStrategy.buy.evaluate(bars, { rsRating: 50, currency: "KRW" });
    const latest = bars[bars.length - 1];

    expect(result.eligible).toBe(true);
    expect(result.levels?.entry).toBeCloseTo(latest.close + (latest.high - latest.low) * 0.5);
  });

  it("rejects choppy doji bars through the noise filter", () => {
    const bars = barsFromCloses(geometric(10_000, 0.003, 40)).map((bar) => ({
      ...bar,
      open: bar.close,
      high: bar.close * 1.03,
      low: bar.close * 0.97,
    }));

    expect(failedKeys(volatilityBreakoutStrategy.buy.evaluate(bars, { rsRating: 50, currency: "KRW" }).checks)).toContain("noise");
  });
});

describe("turtle / Darvas breakout", () => {
  const boxCloses = Array.from({ length: 60 }, (_, index) => (index % 4 === 1 ? 10_800 : 10_200));

  it("finds the box that formed before today", () => {
    const box = findDarvasBox(barsFromCloses(boxCloses));

    expect(box?.top).toBeCloseTo(10_800 * 1.01);
    expect(box?.height).toBeLessThan(0.15);
  });

  it("accepts a high-volume close above the box and the 20-day high", () => {
    const bars = withLast(barsFromCloses([...boxCloses, 10_200]), {
      open: 10_300,
      high: 11_600,
      low: 10_250,
      close: 11_500,
      volume: 3_000_000,
    });
    const result = turtleDarvasStrategy.buy.evaluate(bars, { rsRating: 50, currency: "KRW" });

    expect(failedKeys(result.checks.filter((item) => item.required))).toEqual([]);
    expect(result.eligible).toBe(true);
    expect(result.levels?.stop).toBeLessThan(11_500);
  });

  it("rejects a breakout without volume", () => {
    const bars = withLast(barsFromCloses([...boxCloses, 10_200]), { close: 11_500, high: 11_600, volume: 1_000_000 });

    expect(failedKeys(turtleDarvasStrategy.buy.evaluate(bars, { rsRating: 50, currency: "KRW" }).checks)).toContain("volume");
  });
});

describe("Granville pullback", () => {
  it("accepts a quiet pullback to a rising 20-day line in an aligned uptrend", () => {
    const rally = geometric(10_000, 0.008, 150);
    const peak = rally[rally.length - 1];
    const pullback = [0.99, 0.98, 0.975, 0.97, 0.968].map((ratio) => peak * ratio);
    const closes = [...rally, ...pullback];
    const bars = barsFromCloses(closes).map((bar, index) => ({
      ...bar,
      volume: index >= rally.length ? 500_000 : 1_000_000,
    }));
    const last = bars[bars.length - 1];
    const result = granvillePullbackStrategy.buy.evaluate(withLast(bars, { open: last.close * 0.99 }), { rsRating: 50, currency: "KRW" });

    expect(failedKeys(result.checks)).toEqual([]);
    expect(result.eligible).toBe(true);
    expect(result.levels?.target).toBeGreaterThan(last.close);
  });

  it("rejects a stock that is still extended far above the 20-day line", () => {
    const result = granvillePullbackStrategy.buy.evaluate(barsFromCloses(geometric(10_000, 0.01, 150)), { rsRating: 50, currency: "KRW" });

    expect(failedKeys(result.checks)).toContain("near-ma20");
  });
});

describe("sell signals", () => {
  const rally = geometric(10_000, 0.004, 280);
  const peak = rally[rally.length - 1];
  const breakdown = [...rally, ...[0.97, 0.94, 0.92, 0.9, 0.88].map((ratio) => peak * ratio)];

  it("flags a fresh 50-day breakdown under SEPA", () => {
    const bars = withLast(barsFromCloses(breakdown), { volume: 3_000_000 });
    const result = sepaStrategy.sell.evaluate(bars, { rsRating: 40, currency: "KRW" });

    expect(failedKeys(result.checks.filter((item) => item.required))).toEqual([]);
    expect(result.eligible).toBe(true);
  });

  it("flags a close under the 10-day low as a turtle exit", () => {
    const bars = withLast(barsFromCloses(breakdown), { volume: 2_000_000 });

    expect(turtleDarvasStrategy.sell.evaluate(bars, { rsRating: 40, currency: "KRW" }).eligible).toBe(true);
  });

  it("does not raise sell signals on a healthy uptrend", () => {
    const bars = barsFromCloses(rally);

    for (const strategy of [sepaStrategy, turtleDarvasStrategy, granvillePullbackStrategy, volatilityBreakoutStrategy]) {
      expect(strategy.sell.evaluate(bars, { rsRating: 90, currency: "KRW" }).eligible).toBe(false);
    }
  });

  it("flags a falling 20-day line under Granville", () => {
    const decline = geometric(10_000, -0.004, 150);
    const result = granvillePullbackStrategy.sell.evaluate(barsFromCloses(decline), { rsRating: 10, currency: "KRW" });

    expect(failedKeys(result.checks.filter((item) => item.required))).toEqual([]);
  });
});

describe("pick selection", () => {
  it("keeps the overall top picks plus the top picks of every sector", () => {
    const pick = (symbol: string, score: number) => ({ symbol, score, eligible: true, checks: [], rationale: "", rsRating: 50 });
    const picks = [pick("a", 90), pick("b", 80), pick("c", 70), pick("d", 10)];
    const sectors = new Map<string, string | null>([["a", "반도체"], ["b", "반도체"], ["c", "반도체"], ["d", "바이오"]]);

    expect(selectPicks(picks, sectors, 2).map((item) => item.symbol)).toEqual(["a", "b", "d"]);
  });
});

describe("price formatting", () => {
  it("formats won as integers and dollars with cents", () => {
    expect(priceFormatter("KRW")(72_300.4)).toBe("72,300원");
    expect(priceFormatter("USD")(1234.5)).toBe("$1,234.50");
  });
});
