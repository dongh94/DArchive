"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { GuestPhotosSection } from "./components/guest-photos-section";
import { WeddingQueryProvider } from "./components/wedding-query-provider";

export function GuestPhotosPage() {
  return (
    <WeddingQueryProvider>
      <div className="wedding-page flex min-h-screen justify-center bg-neutral-50 selection:bg-brand-gold/20">
        <div className="relative flex min-h-screen min-w-[360px] max-w-[420px] flex-col overflow-hidden bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-brand-gold/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold">Live Photos</p>
              <p className="mt-1 font-serif text-lg text-brand-ink">동희와 지연의 사진들</p>
            </div>
            <Link
              href="/wedding"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-brand-gold/25 bg-brand-beige/40 px-3 text-xs font-semibold tracking-[0.06em] text-brand-ink shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-beige active:scale-[0.98]"
            >
              청첩장 보기
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </header>

          <main className="flex min-h-0 flex-1 flex-col">
            <GuestPhotosSection />
          </main>

          <footer className="border-t border-brand-gold/5 bg-brand-beige/20 py-10 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-brand-ink">
              Crafted with love by Donghee Kim
            </p>
          </footer>
        </div>
      </div>
    </WeddingQueryProvider>
  );
}
