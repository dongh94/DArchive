import { z } from "zod";
import { getPrisma, MarketRegion, StrategySide } from "@darchive/db";
import { sma } from "../stocks/strategies/indicators";
import { STRATEGIES } from "../stocks/strategies/registry";
import type { StrategyCheck, StrategyLevels } from "../stocks/strategies/types";
import { adminProcedure, router } from "../trpc";

const TOP_PICK_COUNT = 20;
const CHART_BARS = 120;
const CHART_MA_PERIOD = 20;
const RECENT_RUN_COUNT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

type StoredPickLevels = StrategyLevels & { rsRating?: number };

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const strategyMeta = STRATEGIES.map(({ id, name, author, source, buy, sell }) => ({
  id,
  name,
  author,
  source,
  buy: { summary: buy.summary, rules: buy.rules, action: buy.action },
  sell: { summary: sell.summary, rules: sell.rules, action: sell.action },
}));

async function loadCharts(symbols: string[], asOfDate: Date) {
  const candles = await getPrisma().dailyCandle.findMany({
    where: {
      symbol: { in: symbols },
      date: { lte: asOfDate, gte: new Date(asOfDate.getTime() - 220 * DAY_MS) },
    },
    select: { symbol: true, close: true },
    orderBy: [{ symbol: "asc" }, { date: "asc" }],
  });

  const closesBySymbol = new Map<string, number[]>();
  for (const candle of candles) {
    const closes = closesBySymbol.get(candle.symbol) ?? [];
    closes.push(candle.close);
    closesBySymbol.set(candle.symbol, closes);
  }

  return new Map(
    [...closesBySymbol].map(([symbol, closes]) => {
      const start = Math.max(0, closes.length - CHART_BARS);
      return [
        symbol,
        {
          closes: closes.slice(start),
          ma20: closes.slice(start).map((_, index) => sma(closes.slice(0, start + index + 1), CHART_MA_PERIOD)),
        },
      ];
    }),
  );
}

export const stocksRouter = router({
  overview: adminProcedure
    .input(
      z.object({
        region: z.enum([MarketRegion.KR, MarketRegion.US]).default(MarketRegion.KR),
        side: z.enum([StrategySide.BUY, StrategySide.SELL]).default(StrategySide.BUY),
        strategyId: z.string().max(40).optional(),
        sector: z.string().max(100).optional(),
        date: z.iso.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const prisma = getPrisma();
      const strategy = strategyMeta.find((item) => item.id === input.strategyId) ?? strategyMeta[0];
      const runFilter = { strategyId: strategy.id, region: input.region, side: input.side };

      const [recentRuns, run] = await Promise.all([
        prisma.strategyRun.findMany({
          where: runFilter,
          select: { asOfDate: true },
          orderBy: { asOfDate: "desc" },
          take: RECENT_RUN_COUNT,
        }),
        prisma.strategyRun.findFirst({
          where: { ...runFilter, ...(input.date ? { asOfDate: new Date(`${input.date}T00:00:00.000Z`) } : {}) },
          orderBy: { asOfDate: "desc" },
          select: { id: true, asOfDate: true, universeSize: true },
        }),
      ]);

      if (!run) {
        return { strategies: strategyMeta, strategy, runDates: [], sectors: [], run: null };
      }

      const [sectorRows, picks] = await Promise.all([
        prisma.strategyPick.findMany({
          where: { runId: run.id },
          select: { eligible: true, stock: { select: { sectorName: true } } },
        }),
        prisma.strategyPick.findMany({
          where: { runId: run.id, ...(input.sector ? { stock: { sectorName: input.sector } } : {}) },
          orderBy: [{ eligible: "desc" }, { score: "desc" }],
          take: TOP_PICK_COUNT,
          select: {
            symbol: true,
            score: true,
            eligible: true,
            checks: true,
            rationale: true,
            levels: true,
            stock: { select: { name: true, market: true, sectorName: true, marketCap: true } },
          },
        }),
      ]);

      // Sectors are listed by how many names fully meet the strategy, so the busiest ones come first.
      const sectorCounts = new Map<string, number>();
      for (const row of sectorRows) {
        if (row.stock.sectorName) {
          sectorCounts.set(row.stock.sectorName, (sectorCounts.get(row.stock.sectorName) ?? 0) + Number(row.eligible));
        }
      }

      const charts = await loadCharts(picks.map((pick) => pick.symbol), run.asOfDate);

      return {
        strategies: strategyMeta,
        strategy,
        runDates: recentRuns.map((item) => toIsoDate(item.asOfDate)),
        sectors: [...sectorCounts]
          .map(([name, eligibleCount]) => ({ name, eligibleCount }))
          .sort((a, b) => b.eligibleCount - a.eligibleCount || a.name.localeCompare(b.name, "ko")),
        run: {
          asOfDate: toIsoDate(run.asOfDate),
          universeSize: run.universeSize,
          currency: input.region === MarketRegion.US ? ("USD" as const) : ("KRW" as const),
          picks: picks.map((pick, index) => {
            const levels = (pick.levels ?? {}) as StoredPickLevels;

            return {
              rank: index + 1,
              symbol: pick.symbol,
              name: pick.stock.name,
              market: pick.stock.market,
              sectorName: pick.stock.sectorName,
              marketCap: pick.stock.marketCap === null ? null : Number(pick.stock.marketCap),
              score: pick.score,
              eligible: pick.eligible,
              checks: pick.checks as StrategyCheck[],
              rationale: pick.rationale,
              rsRating: levels.rsRating ?? null,
              levels: { entry: levels.entry, stop: levels.stop, target: levels.target, note: levels.note },
              chart: charts.get(pick.symbol) ?? null,
            };
          }),
        },
      };
    }),
});
