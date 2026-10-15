import { Check, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { screenerCopy } from "../data/screener-copy";
import { changeColorClass, formatMarketCap, formatPrice, formatSignedPercent, formatSignedPrice, type Currency } from "../lib/format";
import { getPriceStats } from "../lib/pick-stats";
import type { Side } from "../lib/screener-params";
import type { TopPick } from "../lib/types";
import { PriceChart } from "./price-chart";
import { StockAvatar } from "./stock-avatar";

const LEVEL_LABELS = {
  buy: { entry: "진입 참고가", stop: "손절 참고가", target: "목표 참고가" },
  sell: { entry: "기준가", stop: "이탈 기준가", target: "목표가" },
} as const;

export function PickDetail({ pick, side, currency }: { pick: TopPick; side: Side; currency: Currency }) {
  const { close, change, changeRatio } = getPriceStats(pick);
  const passedCount = pick.checks.filter((item) => item.passed).length;
  const sideCopy = screenerCopy.sides[side];
  const accent = side === "sell" ? "#3182f6" : "#f04452";
  const levels = (["entry", "stop", "target"] as const).flatMap((key) => {
    const value = pick.levels[key];
    return typeof value === "number" ? [{ key, label: LEVEL_LABELS[side][key], value }] : [];
  });

  return (
    <article className="rounded-3xl bg-white p-6 md:p-8">
      <header className="flex items-center gap-3">
        <StockAvatar symbol={pick.symbol} name={pick.name} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-xl font-bold text-[#191f28]">{pick.name}</h3>
          <p className="text-sm text-[#8b95a1]">
            {pick.symbol} · {pick.market}
            {pick.sectorName ? ` · ${pick.sectorName}` : ""}
          </p>
        </div>
      </header>

      {close !== null ? (
        <div className="mt-5">
          <p className="text-[32px] font-bold leading-none tracking-tight tabular-nums text-[#191f28]">{formatPrice(close, currency)}</p>
          <p className={cn("mt-2 text-[15px] font-semibold tabular-nums", changeColorClass(change))}>
            {formatSignedPrice(change, currency)} ({formatSignedPercent(changeRatio)})
            <span className="ml-2 font-normal text-[#8b95a1]">기준일 종가</span>
          </p>
        </div>
      ) : null}

      {pick.chart ? (
        <div className="mt-6">
          <PriceChart closes={pick.chart.closes} ma20={pick.chart.ma20} label={`${pick.name} 최근 종가와 20일선`} />
          <p className="mt-2 flex items-center gap-3 text-xs text-[#8b95a1]">
            <span>최근 {pick.chart.closes.length}거래일</span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 border-t border-dashed border-[#b0b8c1]" />
              20일 이동평균
            </span>
          </p>
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl bg-[#f9fafb] p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[#4e5968]">{sideCopy.scoreLabel}</p>
            <p className="mt-1 text-[26px] font-bold tabular-nums text-[#191f28]">
              {pick.score.toFixed(1)}
              <span className="ml-0.5 text-base font-semibold text-[#8b95a1]">점</span>
            </p>
          </div>
          <span
            className={cn("rounded-full px-3 py-1.5 text-xs font-bold", pick.eligible ? "text-white" : "bg-[#fff4e5] text-[#e5880e]")}
            style={pick.eligible ? { backgroundColor: accent } : undefined}
          >
            {pick.eligible ? sideCopy.eligibleLabel : "근접 후보"}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5e8eb]">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pick.score)}%`, backgroundColor: accent }} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white py-2.5">
            <dt className="text-xs text-[#8b95a1]">조건 충족</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-[#191f28]">
              {passedCount}/{pick.checks.length}
            </dd>
          </div>
          <div className="rounded-xl bg-white py-2.5">
            <dt className="text-xs text-[#8b95a1]">상대강도</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-[#191f28]">{pick.rsRating ?? "—"}</dd>
          </div>
          <div className="rounded-xl bg-white py-2.5">
            <dt className="text-xs text-[#8b95a1]">시가총액</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-[#191f28]">
              {pick.marketCap !== null ? formatMarketCap(pick.marketCap) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6">
        <h4 className="text-[17px] font-bold text-[#191f28]">왜 골랐나요?</h4>
        <p className="mt-2 text-[15px] leading-7 text-[#4e5968]">{pick.rationale}</p>
      </section>

      <section className="mt-6">
        <h4 className="text-[17px] font-bold text-[#191f28]">조건 체크리스트</h4>
        <ul className="mt-3 divide-y divide-[#f2f4f6]">
          {pick.checks.map((item) => (
            <li key={item.key} className="flex items-center gap-3 py-3">
              <span
                className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", item.passed ? "text-white" : "bg-[#f2f4f6] text-[#b0b8c1]")}
                style={item.passed ? { backgroundColor: accent } : undefined}
                aria-label={item.passed ? "충족" : "미충족"}
              >
                {item.passed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <p className={cn("min-w-0 flex-1 text-[15px] font-medium", item.passed ? "text-[#191f28]" : "text-[#8b95a1]")}>
                {item.label}
                {item.required ? null : <span className="ml-1.5 text-xs font-semibold text-[#b0b8c1]">가점</span>}
              </p>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-[#333d4b]">{item.value}</p>
                <p className="text-xs tabular-nums text-[#b0b8c1]">기준 {item.threshold}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {levels.length > 0 ? (
        <section className="mt-4 grid grid-cols-3 gap-2">
          {levels.map((level) => {
            const distance = close ? level.value / close - 1 : null;

            return (
              <div key={level.key} className="rounded-2xl bg-[#f9fafb] px-3 py-3">
                <p className="text-xs text-[#8b95a1]">{level.label}</p>
                <p className="mt-1 text-[15px] font-bold tabular-nums text-[#191f28]">{formatPrice(level.value, currency)}</p>
                {distance !== null ? (
                  <p className={cn("text-xs font-semibold tabular-nums", changeColorClass(distance))}>{formatSignedPercent(distance)}</p>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}
      {pick.levels.note ? <p className="mt-3 text-xs text-[#8b95a1]">{pick.levels.note}</p> : null}
    </article>
  );
}
