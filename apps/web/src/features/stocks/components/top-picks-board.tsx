"use client";

import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { screenerCopy } from "../data/screener-copy";
import { changeColorClass, formatPrice, formatSignedPercent, type Currency } from "../lib/format";
import { getPriceStats } from "../lib/pick-stats";
import type { Side } from "../lib/screener-params";
import type { TopPick } from "../lib/types";
import { PickDetail } from "./pick-detail";
import { StockAvatar } from "./stock-avatar";

// Matches Tailwind's `lg` breakpoint, where the list and detail sit side by side.
const SIDE_BY_SIDE_QUERY = "(min-width: 1024px)";

export function TopPicksBoard({
  picks,
  side,
  currency,
  sectorLabel,
}: {
  picks: TopPick[];
  side: Side;
  currency: Currency;
  sectorLabel?: string;
}) {
  const [selectedSymbol, setSelectedSymbol] = useState(() => picks[0]?.symbol);
  const detailRef = useRef<HTMLDivElement>(null);
  const selected = picks.find((pick) => pick.symbol === selectedSymbol) ?? picks[0];
  const hasIneligiblePick = picks.some((pick) => !pick.eligible);
  const sideCopy = screenerCopy.sides[side];

  const select = (symbol: string) => {
    setSelectedSymbol(symbol);

    // Stacked on narrow screens the detail sits below 20 rows, so bring it into view.
    if (!window.matchMedia(SIDE_BY_SIDE_QUERY).matches) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <section className="rounded-3xl bg-white p-4 md:p-5">
        <div className="px-2 pb-3">
          <h2 className="text-[20px] font-bold text-[#191f28]">{sideCopy.listTitle}</h2>
          <p className="mt-1 text-sm text-[#8b95a1]">
            {sectorLabel ? `${sectorLabel} · ` : ""}
            {sideCopy.scoreLabel} 순 Top {picks.length}
          </p>
        </div>
        <ol>
          {picks.map((pick) => {
            const { close, changeRatio } = getPriceStats(pick);
            const isSelected = pick.symbol === selected?.symbol;

            return (
              <li key={pick.symbol}>
                <button
                  type="button"
                  onClick={() => select(pick.symbol)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors",
                    isSelected ? "bg-[#f2f4f6]" : "hover:bg-[#f9fafb]",
                  )}
                >
                  <span
                    className={cn(
                      "w-6 shrink-0 text-center text-[17px] font-bold tabular-nums",
                      pick.rank > 3 && "text-[#8b95a1]",
                    )}
                    style={pick.rank <= 3 ? { color: side === "sell" ? "#3182f6" : "#f04452" } : undefined}
                  >
                    {pick.rank}
                  </span>
                  <StockAvatar symbol={pick.symbol} name={pick.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[#191f28]">{pick.name}</span>
                    <span className="flex items-center gap-1.5 text-[13px] text-[#8b95a1]">
                      <span className="tabular-nums">{pick.score.toFixed(1)}점</span>
                      {pick.eligible ? null : <span className="font-semibold text-[#e5880e]">근접</span>}
                      {pick.sectorName ? <span className="truncate">· {pick.sectorName}</span> : null}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-semibold tabular-nums text-[#191f28]">
                      {close !== null ? formatPrice(close, currency) : "—"}
                    </span>
                    <span className={cn("block text-[13px] font-medium tabular-nums", changeColorClass(changeRatio))}>
                      {formatSignedPercent(changeRatio)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {hasIneligiblePick ? (
          <p className="mt-2 rounded-2xl bg-[#fff8ed] px-3 py-2.5 text-[13px] leading-5 text-[#b8700b]">{screenerCopy.ineligibleNotice}</p>
        ) : null}
      </section>

      <div ref={detailRef} className="scroll-mt-4">
        {selected ? <PickDetail key={selected.symbol} pick={selected} side={side} currency={currency} /> : null}
      </div>
    </div>
  );
}
