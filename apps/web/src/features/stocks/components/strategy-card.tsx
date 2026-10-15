import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { screenerCopy } from "../data/screener-copy";
import { screenerHref, type ScreenerParams } from "../lib/screener-params";
import type { StrategyMeta, StrategyRunView } from "../lib/types";

export function StrategyCard({
  strategy,
  run,
  runDates,
  params,
}: {
  strategy: StrategyMeta;
  run: StrategyRunView | null;
  runDates: string[];
  params: ScreenerParams;
}) {
  const sideRules = strategy[params.side];
  const isSell = params.side === "sell";

  return (
    <section className="rounded-3xl bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", isSell ? "bg-[#e8f3ff] text-[#3182f6]" : "bg-[#ffeef0] text-[#f04452]")}>
              {screenerCopy.sides[params.side].label} 신호
            </span>
            <span className="text-[#6b7684]">{strategy.author}</span>
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#191f28] md:text-[28px]">{strategy.name}</h2>
          <p className="mt-1 text-sm text-[#8b95a1]">{strategy.source}</p>
          <p className="mt-4 text-[15px] leading-7 text-[#4e5968]">{sideRules.summary}</p>
        </div>
        <dl className="flex gap-6 rounded-2xl bg-[#f9fafb] px-5 py-4">
          <div>
            <dt className="text-xs text-[#8b95a1]">기준일</dt>
            <dd className="mt-1 text-[17px] font-bold tabular-nums text-[#191f28]">{run?.asOfDate ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8b95a1]">평가 종목</dt>
            <dd className="mt-1 text-[17px] font-bold tabular-nums text-[#191f28]">
              {run ? `${run.universeSize.toLocaleString("ko-KR")}개` : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <details className="group mt-6 border-t border-[#f2f4f6] pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-[#333d4b]">
          {screenerCopy.sides[params.side].label} 규칙 보기
          <span className="text-[#b0b8c1] transition-transform group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <ol className="mt-4 grid gap-2.5">
          {sideRules.rules.map((rule, index) => (
            <li key={rule} className="flex gap-3 text-[15px] text-[#4e5968]">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isSell ? "bg-[#e8f3ff] text-[#3182f6]" : "bg-[#ffeef0] text-[#f04452]",
                )}
              >
                {index + 1}
              </span>
              {rule}
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-2xl bg-[#f9fafb] px-4 py-3 text-sm font-medium text-[#333d4b]">{sideRules.action}</p>
        <p className="mt-2 text-xs text-[#8b95a1]">평가 대상: {screenerCopy.universeNote[params.region]}</p>
      </details>

      {runDates.length > 1 ? (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-[#8b95a1]">지난 결과</span>
          {runDates.map((date) => (
            <Link
              key={date}
              href={screenerHref(params, { date })}
              scroll={false}
              aria-current={date === run?.asOfDate ? "date" : undefined}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold tabular-nums transition-colors",
                date === run?.asOfDate ? "bg-[#e8f3ff] text-[#3182f6]" : "text-[#8b95a1] hover:bg-[#f2f4f6]",
              )}
            >
              {date.slice(5).replace("-", ".")}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
