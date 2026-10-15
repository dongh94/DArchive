import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { CriteriaTable } from "./components/criteria-table";
import { ScreenerFilters } from "./components/screener-filters";
import { StrategyCard } from "./components/strategy-card";
import { TopPicksBoard } from "./components/top-picks-board";
import { screenerCopy } from "./data/screener-copy";
import type { ScreenerParams } from "./lib/screener-params";
import type { StocksOverview } from "./lib/types";

const COMPARE_COUNT = 5;

export function StocksScreener({ overview, params }: { overview: StocksOverview; params: ScreenerParams }) {
  const { strategy, run, runDates } = overview;
  const accent = params.side === "sell" ? "#3182f6" : "#f04452";

  return (
    <main
      className="min-h-screen bg-[#f2f4f6] text-[#191f28]"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif' }}
    >
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 pt-6 md:px-6 md:pt-10">
        <header className="pb-2">
          <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-[#8b95a1] transition-colors hover:text-[#4e5968]">
            <ArrowLeft className="h-4 w-4" />
            Projects
          </Link>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight md:text-[34px]">{screenerCopy.title}</h1>
          <p className="mt-1 max-w-2xl text-[15px] leading-6 text-[#6b7684]">{screenerCopy.description}</p>
        </header>

        <ScreenerFilters overview={overview} params={params} />
        <StrategyCard strategy={strategy} run={run} runDates={runDates} params={params} />

        {run && run.picks.length > 0 ? (
          <>
            <TopPicksBoard
              key={`${params.region}-${params.side}-${strategy.id}-${params.sector ?? ""}-${run.asOfDate}`}
              picks={run.picks}
              side={params.side}
              currency={run.currency}
              sectorLabel={params.sector}
            />
            <CriteriaTable picks={run.picks.slice(0, COMPARE_COUNT)} accent={accent} />
          </>
        ) : (
          <section className="flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f3ff] text-2xl" aria-hidden>
              📈
            </span>
            <h2 className="mt-5 text-[20px] font-bold">{screenerCopy.emptyTitle}</h2>
            <p className="mt-2 max-w-md text-[15px] leading-6 text-[#6b7684]">{screenerCopy.emptyDescription}</p>
          </section>
        )}

        <p className="flex gap-2 px-2 pt-2 text-[13px] leading-5 text-[#8b95a1]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {screenerCopy.disclaimer}
        </p>
      </div>
    </main>
  );
}
