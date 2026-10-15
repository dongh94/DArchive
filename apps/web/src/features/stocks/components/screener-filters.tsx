import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { screenerCopy } from "../data/screener-copy";
import { screenerHref, type ScreenerParams } from "../lib/screener-params";
import type { StocksOverview } from "../lib/types";

const SIDE_ACTIVE_CLASS = {
  buy: "bg-[#f04452] text-white",
  sell: "bg-[#3182f6] text-white",
} as const;

function Segmented({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full bg-[#e5e8eb] p-1">
      {children}
    </div>
  );
}

export function ScreenerFilters({ overview, params }: { overview: StocksOverview; params: ScreenerParams }) {
  const segmentClass = "inline-flex h-9 min-w-16 items-center justify-center rounded-full px-4 text-[15px] font-semibold transition-colors";

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="시장">
          {screenerCopy.regions.map((region) => (
            <Link
              key={region.value}
              href={screenerHref(params, { region: region.value })}
              scroll={false}
              aria-current={params.region === region.value ? "page" : undefined}
              className={cn(segmentClass, params.region === region.value ? "bg-white text-[#191f28] shadow-sm" : "text-[#6b7684]")}
            >
              {region.label}
            </Link>
          ))}
        </Segmented>
        <Segmented label="매수 매도">
          {(["buy", "sell"] as const).map((side) => (
            <Link
              key={side}
              href={screenerHref(params, { side })}
              scroll={false}
              aria-current={params.side === side ? "page" : undefined}
              className={cn(segmentClass, params.side === side ? SIDE_ACTIVE_CLASS[side] : "text-[#6b7684]")}
            >
              {screenerCopy.sides[side].label}
            </Link>
          ))}
        </Segmented>
      </div>

      <nav aria-label="매매법" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex min-w-max gap-2">
          {overview.strategies.map((strategy) => {
            const isActive = strategy.id === overview.strategy.id;

            return (
              <li key={strategy.id}>
                <Link
                  href={screenerHref(params, { strategy: strategy.id })}
                  scroll={false}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors",
                    isActive ? "bg-[#191f28] text-white" : "bg-white text-[#4e5968] hover:bg-[#e8ebee]",
                  )}
                >
                  {strategy.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {overview.sectors.length > 0 ? (
        <nav aria-label="섹터" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex min-w-max gap-1.5">
            {[{ name: undefined, label: "전체", count: null }, ...overview.sectors.map((sector) => ({ name: sector.name, label: sector.name, count: sector.eligibleCount }))].map(
              (sector) => {
                const isActive = params.sector === sector.name;

                return (
                  <li key={sector.label}>
                    <Link
                      href={screenerHref(params, { sector: sector.name })}
                      scroll={false}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[13px] font-medium transition-colors",
                        isActive ? "bg-[#e8f3ff] text-[#3182f6]" : "text-[#6b7684] hover:bg-white",
                      )}
                    >
                      {sector.label}
                      {sector.count ? <span className="tabular-nums text-[#3182f6]">{sector.count}</span> : null}
                    </Link>
                  </li>
                );
              },
            )}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
