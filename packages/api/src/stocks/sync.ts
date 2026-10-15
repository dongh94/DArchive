import { getPrisma, MarketRegion, StockMarket } from "@darchive/db";
import type { TossCandle, TossClient, TossMarket } from "./toss-client";
import { TossApiError } from "./toss-client";

const BACKFILL_BARS = 300;
const CANDLE_RETENTION_DAYS = 450;
const CANDLE_CONCURRENCY = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
// Thousands of US micro caps would triple sync time while rarely being tradable leaders.
// Toss reports every market cap in KRW, so this is roughly $2B.
const MIN_US_MARKET_CAP_KRW = 3_000_000_000_000;

const MARKETS: { market: TossMarket & StockMarket; region: MarketRegion }[] = [
  { market: StockMarket.KOSPI, region: MarketRegion.KR },
  { market: StockMarket.KOSDAQ, region: MarketRegion.KR },
  { market: StockMarket.NYSE, region: MarketRegion.US },
  { market: StockMarket.NASDAQ, region: MarketRegion.US },
  { market: StockMarket.AMEX, region: MarketRegion.US },
];

// Today's bar is still forming until the regular session (plus closing auction) is over.
const SESSION_SETTLED = {
  [MarketRegion.KR]: { timeZone: "Asia/Seoul", minutes: 15 * 60 + 40 },
  [MarketRegion.US]: { timeZone: "America/New_York", minutes: 16 * 60 + 10 },
} as const;

type Log = (message: string) => void;

type CandleRow = {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: bigint;
};

export async function mapWithConcurrency<T>(items: T[], concurrency: number, task: (item: T, index: number) => Promise<void>) {
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await task(items[index], index);
      }
    }),
  );
}

/** The trading date whose bar may still be incomplete, or null once the session has settled. */
function unsettledDate(region: MarketRegion) {
  const { timeZone, minutes } = SESSION_SETTLED[region];
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );

  return Number(parts.hour) * 60 + Number(parts.minute) < minutes ? `${parts.year}-${parts.month}-${parts.day}` : null;
}

const toDbDate = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);
const fromDbDate = (date: Date) => date.toISOString().slice(0, 10);
const toPrice = (value: string) => Math.round(Number(value) * 10_000) / 10_000;

function toCandleRow(symbol: string, candle: TossCandle): CandleRow {
  return {
    symbol,
    // Timestamps carry the exchange's local offset, so the first 10 characters are the trading date.
    date: toDbDate(candle.timestamp.slice(0, 10)),
    open: toPrice(candle.openPrice),
    high: toPrice(candle.highPrice),
    low: toPrice(candle.lowPrice),
    close: toPrice(candle.closePrice),
    volume: BigInt(Math.round(Number(candle.volume))),
  };
}

export async function syncStockList(client: TossClient, log: Log) {
  const prisma = getPrisma();
  const listedByMarket = await Promise.all(MARKETS.map(({ market }) => client.listStocks(market)));
  const listed = MARKETS.flatMap(({ market, region }, index) =>
    listedByMarket[index].filter((stock) => stock.isCommonShare).map((stock) => ({ ...stock, market, region })),
  );

  const existing = await prisma.stock.findMany({ select: { symbol: true, name: true, market: true, isActive: true } });
  const existingBySymbol = new Map(existing.map((stock) => [stock.symbol, stock]));
  const listedSymbols = new Set(listed.map((stock) => stock.symbol));

  const created = await prisma.stock.createMany({
    data: listed
      .filter((stock) => !existingBySymbol.has(stock.symbol))
      .map((stock) => ({ symbol: stock.symbol, name: stock.name, market: stock.market, region: stock.region, isCommonShare: true })),
    skipDuplicates: true,
  });

  const changed = listed.filter((stock) => {
    const current = existingBySymbol.get(stock.symbol);
    return current && (current.name !== stock.name || current.market !== stock.market || !current.isActive);
  });

  await mapWithConcurrency(changed, CANDLE_CONCURRENCY, async (stock) => {
    await prisma.stock.update({
      where: { symbol: stock.symbol },
      data: { name: stock.name, market: stock.market, region: stock.region, isActive: true },
    });
  });

  const deactivated = await prisma.stock.updateMany({
    where: { isActive: true, symbol: { notIn: [...listedSymbols] } },
    data: { isActive: false },
  });

  const countBy = (region: MarketRegion) => listed.filter((stock) => stock.region === region).length;
  log(
    `종목 목록: 국내 ${countBy(MarketRegion.KR)}개, 해외 ${countBy(MarketRegion.US)}개 (신규 ${created.count}, 변경 ${changed.length}, 비활성 ${deactivated.count})`,
  );
}

export async function syncSectors(client: TossClient, log: Log) {
  const sectors = await client.listSectors();
  const topDepth = Math.min(...sectors.map((sector) => sector.depth));
  const topSectors = sectors.filter((sector) => sector.depth === topDepth);
  const bySymbol = new Map<string, { sectorName: string; marketCap: string | null }>();

  for (const marketCountry of ["KR", "US"] as const) {
    for (const sector of topSectors) {
      const stocks = await client.listSectorStocks(sector.sectorId, marketCountry);

      for (const stock of stocks) {
        if (!bySymbol.has(stock.symbol)) {
          bySymbol.set(stock.symbol, { sectorName: sector.name, marketCap: stock.marketCapitalization });
        }
      }
    }
  }

  const entries = [...bySymbol.entries()];
  const updated = await getPrisma().$executeRaw`
    UPDATE "Stock" AS s
    SET "sectorName" = v.sector_name,
        "marketCap" = v.market_cap::numeric::bigint,
        "updatedAt" = NOW()
    FROM unnest(
      ${entries.map(([symbol]) => symbol)}::text[],
      ${entries.map(([, info]) => info.sectorName)}::text[],
      ${entries.map(([, info]) => info.marketCap)}::text[]
    ) AS v(symbol, sector_name, market_cap)
    WHERE s.symbol = v.symbol
  `;

  log(`섹터: ${topSectors.length}개 섹터, ${updated}개 종목 갱신`);
}

/** Symbols worth collecting candles for: every KR common stock plus US large caps. */
export async function getCandleUniverse() {
  const stocks = await getPrisma().stock.findMany({
    where: {
      isActive: true,
      isCommonShare: true,
      OR: [{ region: MarketRegion.KR }, { region: MarketRegion.US, marketCap: { gte: BigInt(MIN_US_MARKET_CAP_KRW) } }],
    },
    select: { symbol: true, region: true },
    orderBy: [{ region: "asc" }, { symbol: "asc" }],
  });

  return stocks;
}

async function fetchCandles(client: TossClient, symbol: string, bars: number) {
  const rows: CandleRow[] = [];
  let before: string | undefined;

  while (rows.length < bars) {
    const page = await client.getDailyCandles(symbol, { count: Math.min(200, bars - rows.length), before });
    rows.push(...page.candles.map((candle) => toCandleRow(symbol, candle)));

    if (!page.nextBefore || page.candles.length === 0) {
      break;
    }

    before = page.nextBefore;
  }

  return rows;
}

export async function syncCandles(
  client: TossClient,
  stocks: { symbol: string; region: MarketRegion }[],
  log: Log,
  { backfill = false } = {},
) {
  const prisma = getPrisma();
  const unsettled = { [MarketRegion.KR]: unsettledDate(MarketRegion.KR), [MarketRegion.US]: unsettledDate(MarketRegion.US) };
  const lastCandles = await prisma.$queryRaw<{ symbol: string; date: string; close: number }[]>`
    SELECT DISTINCT ON (symbol) symbol, date::text AS date, close
    FROM "DailyCandle"
    ORDER BY symbol, date DESC
  `;
  const lastBySymbol = new Map(lastCandles.map((candle) => [candle.symbol, candle]));
  const stats = { inserted: 0, replaced: 0, failed: 0 };

  await mapWithConcurrency(stocks, CANDLE_CONCURRENCY, async ({ symbol, region }, index) => {
    try {
      const last = backfill ? undefined : lastBySymbol.get(symbol);
      let rows: CandleRow[];
      let replace = !last;

      if (last) {
        const lastDate = toDbDate(last.date);
        const gapDays = Math.ceil((Date.now() - lastDate.getTime()) / DAY_MS);
        rows = await fetchCandles(client, symbol, Math.min(200, Math.ceil((gapDays * 5) / 7) + 3));
        const overlap = rows.find((row) => fromDbDate(row.date) === last.date);

        // A changed close on an already stored day means the adjusted series was rewritten
        // (split, rights issue), so the stored history must be replaced, not appended to.
        if (!overlap || Math.abs(overlap.close - last.close) > 1e-6) {
          rows = await fetchCandles(client, symbol, BACKFILL_BARS);
          replace = true;
        } else {
          rows = rows.filter((row) => row.date > lastDate);
        }
      } else {
        rows = await fetchCandles(client, symbol, BACKFILL_BARS);
      }

      const unsettledDay = unsettled[region];
      if (unsettledDay) {
        rows = rows.filter((row) => fromDbDate(row.date) !== unsettledDay);
      }

      if (replace) {
        await prisma.$transaction([
          prisma.dailyCandle.deleteMany({ where: { symbol } }),
          prisma.dailyCandle.createMany({ data: rows }),
        ]);
        stats.replaced += 1;
      } else if (rows.length > 0) {
        await prisma.dailyCandle.createMany({ data: rows, skipDuplicates: true });
      }

      stats.inserted += rows.length;
    } catch (error) {
      stats.failed += 1;
      const reason = error instanceof TossApiError ? `${error.status} ${error.code ?? ""}` : String(error);
      log(`  ✗ ${symbol}: ${reason}`);
    }

    if ((index + 1) % 200 === 0) {
      log(`  일봉 ${index + 1}/${stocks.length}`);
    }
  });

  const pruned = await prisma.dailyCandle.deleteMany({
    where: { date: { lt: new Date(Date.now() - CANDLE_RETENTION_DAYS * DAY_MS) } },
  });

  log(
    `일봉: ${stocks.length}개 종목, ${stats.inserted}봉 저장 (전체 재수집 ${stats.replaced}, 실패 ${stats.failed}, 정리 ${pruned.count})`,
  );

  return stats;
}
