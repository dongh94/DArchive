import { getPrisma, MarketRegion, StrategySide } from "@darchive/db";
import { averageTurnover, closesOf, relativeStrengthScore, toPercentileRatings } from "./strategies/indicators";
import { STRATEGIES } from "./strategies/registry";
import type { Bar, Currency, StrategyDefinition, StrategyEvaluation } from "./strategies/types";

const PICKS_PER_GROUP = 20;
const LOOKBACK_DAYS = 420;
const RUN_RETENTION_DAYS = 30;
const SYMBOL_BATCH_SIZE = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

const REGIONS = [
  { region: MarketRegion.KR, label: "국내", currency: "KRW", minAverageTurnover: 1_000_000_000 },
  { region: MarketRegion.US, label: "해외", currency: "USD", minAverageTurnover: 10_000_000 },
] as const satisfies { region: MarketRegion; label: string; currency: Currency; minAverageTurnover: number }[];

const SIDES = [
  { side: StrategySide.BUY, label: "매수", key: "buy" },
  { side: StrategySide.SELL, label: "매도", key: "sell" },
] as const;

type Log = (message: string) => void;

type RankedPick = StrategyEvaluation & { symbol: string; rsRating: number };

async function loadSeries(symbols: string[]) {
  const prisma = getPrisma();
  const since = new Date(Date.now() - LOOKBACK_DAYS * DAY_MS);
  const series = new Map<string, Bar[]>();

  for (let start = 0; start < symbols.length; start += SYMBOL_BATCH_SIZE) {
    const candles = await prisma.dailyCandle.findMany({
      where: { symbol: { in: symbols.slice(start, start + SYMBOL_BATCH_SIZE) }, date: { gte: since } },
      select: { symbol: true, date: true, open: true, high: true, low: true, close: true, volume: true },
      orderBy: [{ symbol: "asc" }, { date: "asc" }],
    });

    for (const candle of candles) {
      const bars = series.get(candle.symbol) ?? [];
      bars.push({
        date: candle.date.toISOString().slice(0, 10),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: Number(candle.volume),
      });
      series.set(candle.symbol, bars);
    }
  }

  return series;
}

const byStrength = (a: RankedPick, b: RankedPick) =>
  Number(b.eligible) - Number(a.eligible) || b.score - a.score || b.rsRating - a.rsRating;

/**
 * Keeps the overall Top 20 plus each sector's Top 20, so the page can filter by sector
 * without storing an evaluation for every symbol.
 */
export function selectPicks(picks: RankedPick[], sectorBySymbol: Map<string, string | null>, limit = PICKS_PER_GROUP) {
  const sorted = [...picks].sort(byStrength);
  const kept = new Set(sorted.slice(0, limit).map((pick) => pick.symbol));
  const perSector = new Map<string, number>();

  for (const pick of sorted) {
    const sector = sectorBySymbol.get(pick.symbol);

    if (!sector) {
      continue;
    }

    const count = perSector.get(sector) ?? 0;

    if (count < limit) {
      kept.add(pick.symbol);
      perSector.set(sector, count + 1);
    }
  }

  return sorted.filter((pick) => kept.has(pick.symbol));
}

export function evaluateStrategy(
  strategy: StrategyDefinition,
  side: "buy" | "sell",
  series: Map<string, Bar[]>,
  rsRatings: Map<string, number>,
  currency: Currency,
) {
  const picks: RankedPick[] = [];

  for (const [symbol, bars] of series) {
    if (bars.length < strategy.minBars) {
      continue;
    }

    const rsRating = rsRatings.get(symbol) ?? 0;
    picks.push({ ...strategy[side].evaluate(bars, { rsRating, currency }), symbol, rsRating });
  }

  return picks;
}

export async function runStrategies(log: Log) {
  const prisma = getPrisma();

  for (const { region, label, currency, minAverageTurnover } of REGIONS) {
    const stocks = await prisma.stock.findMany({
      where: { region, isActive: true, isCommonShare: true },
      select: { symbol: true, sectorName: true },
    });
    const sectorBySymbol = new Map(stocks.map((stock) => [stock.symbol, stock.sectorName]));
    const allSeries = await loadSeries(stocks.map((stock) => stock.symbol));
    const asOfDate = [...allSeries.values()].reduce((latest, bars) => {
      const date = bars[bars.length - 1]?.date ?? "";
      return date > latest ? date : latest;
    }, "");

    if (!asOfDate) {
      log(`${label} 전략 건너뜀: 일봉 데이터가 없습니다.`);
      continue;
    }

    // Suspended or illiquid names would otherwise float to the top on stale or thin data.
    const series = new Map(
      [...allSeries].filter(
        ([, bars]) => bars[bars.length - 1].date === asOfDate && (averageTurnover(bars, 20) ?? 0) >= minAverageTurnover,
      ),
    );

    const rsScores = new Map<string, number>();
    for (const [symbol, bars] of series) {
      const score = relativeStrengthScore(closesOf(bars));
      if (score !== null) {
        rsScores.set(symbol, score);
      }
    }
    const rsRatings = toPercentileRatings(rsScores);
    const asOf = new Date(`${asOfDate}T00:00:00.000Z`);

    for (const strategy of STRATEGIES) {
      for (const { side, label: sideLabel, key } of SIDES) {
        const picks = selectPicks(evaluateStrategy(strategy, key, series, rsRatings, currency), sectorBySymbol);

        await prisma.$transaction([
          prisma.strategyRun.deleteMany({ where: { strategyId: strategy.id, region, side, asOfDate: asOf } }),
          prisma.strategyRun.create({
            data: {
              strategyId: strategy.id,
              region,
              side,
              asOfDate: asOf,
              universeSize: series.size,
              picks: {
                create: picks.map((pick, index) => ({
                  rank: index + 1,
                  symbol: pick.symbol,
                  score: Math.round(pick.score * 10) / 10,
                  eligible: pick.eligible,
                  checks: pick.checks,
                  rationale: pick.rationale.slice(0, 1000),
                  levels: { ...pick.levels, rsRating: pick.rsRating },
                })),
              },
            },
          }),
        ]);

        const eligibleCount = picks.filter((pick) => pick.eligible).length;
        log(`${label} ${sideLabel} · ${strategy.name}: ${asOfDate} 기준 ${series.size}개 평가, ${picks.length}개 저장 (조건 충족 ${eligibleCount})`);
      }
    }
  }

  const pruned = await prisma.strategyRun.deleteMany({
    where: { asOfDate: { lt: new Date(Date.now() - RUN_RETENTION_DAYS * DAY_MS) } },
  });

  if (pruned.count > 0) {
    log(`오래된 전략 결과 ${pruned.count}개 정리`);
  }
}
