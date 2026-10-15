import type { Metadata } from "next";
import { createServerCaller } from "@/features/admin/lib/api";
import { requireAdmin } from "@/features/admin/lib/auth";
import { parseScreenerParams, STOCK_PAGE_PATH } from "@/features/stocks/lib/screener-params";
import { StocksScreener } from "@/features/stocks/stocks-screener";

export const metadata: Metadata = {
  title: "Stock Lab | Projects",
  robots: { index: false },
};

export default async function StockLabRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Toss Open API terms forbid showing its market data to anyone but the account owner.
  await requireAdmin(STOCK_PAGE_PATH);

  const [rawParams, caller] = await Promise.all([searchParams, createServerCaller()]);
  const params = parseScreenerParams(rawParams);
  const overview = await caller.stocks.overview({
    region: params.region === "us" ? "US" : "KR",
    side: params.side === "sell" ? "SELL" : "BUY",
    strategyId: params.strategy,
    sector: params.sector,
    date: params.date,
  });

  return <StocksScreener overview={overview} params={params} />;
}
