import { Check, Minus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { TopPick } from "../lib/types";

export function CriteriaTable({ picks, accent }: { picks: TopPick[]; accent: string }) {
  const criteria = picks[0]?.checks ?? [];

  return (
    <section className="rounded-3xl bg-white p-6 md:p-8">
      <h2 className="text-[20px] font-bold text-[#191f28]">한눈에 비교하기</h2>
      <p className="mt-1 text-sm text-[#8b95a1]">상위 {picks.length}개 종목이 매매법의 각 조건을 얼마나 충족하는지 보여드려요.</p>

      <div className="-mx-6 mt-5 overflow-x-auto px-6 md:-mx-8 md:px-8">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-[13px] font-medium text-[#8b95a1]">
                조건
              </th>
              {picks.map((pick) => (
                <th key={pick.symbol} scope="col" className="px-3 py-3 text-left">
                  <span className="block text-[13px] font-semibold" style={{ color: accent }}>
                    {pick.rank}위
                  </span>
                  <span className="block truncate font-semibold text-[#191f28]">{pick.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((criterion) => (
              <tr key={criterion.key}>
                <th scope="row" className="sticky left-0 z-10 border-t border-[#f2f4f6] bg-white py-3 pr-4 text-left align-top font-medium text-[#333d4b]">
                  {criterion.label}
                  <span className={cn("ml-1.5 text-xs font-semibold", criterion.required ? "text-[#4e5968]" : "text-[#b0b8c1]")}>
                    {criterion.required ? "필수" : "가점"}
                  </span>
                </th>
                {picks.map((pick) => {
                  const cell = pick.checks.find((item) => item.key === criterion.key);

                  return (
                    <td key={pick.symbol} className="border-t border-[#f2f4f6] px-3 py-3 align-top">
                      {cell ? (
                        <div className="flex items-start gap-2">
                          {cell.passed ? (
                            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} strokeWidth={3} aria-label="충족" />
                          ) : (
                            <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[#d1d6db]" strokeWidth={3} aria-label="미충족" />
                          )}
                          <span className={cn("tabular-nums", cell.passed ? "text-[#191f28]" : "text-[#b0b8c1]")}>{cell.value}</span>
                        </div>
                      ) : (
                        <span className="text-[#d1d6db]">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th scope="row" className="sticky left-0 z-10 border-t border-[#e5e8eb] bg-white py-3 pr-4 text-left font-bold text-[#191f28]">
                점수
              </th>
              {picks.map((pick) => (
                <td key={pick.symbol} className="border-t border-[#e5e8eb] px-3 py-3 font-bold tabular-nums text-[#191f28]">
                  {pick.score.toFixed(1)}점
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
