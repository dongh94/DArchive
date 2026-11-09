"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CheckCircle2, Trophy, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { exhibitKindLabels, type Exhibit } from "../data/gallery-content";

export function ExhibitDialog({ accent, exhibit, onClose }: { accent: string; exhibit: Exhibit; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="gallery-dialog-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`exhibit-${exhibit.id}-title`}
        className="gallery-dialog"
        style={{ ["--hall-accent" as string]: accent }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="gallery-kind-pill">{exhibitKindLabels[exhibit.kind]}</span>
              <span className="text-[var(--hall-muted)]">{exhibit.period}</span>
              {exhibit.badge ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#fbbc05]/20 px-2 py-0.5 text-[#8a6100] dark:text-[#fbbc05]">
                  <Trophy className="h-3 w-3" aria-hidden="true" />
                  {exhibit.badge}
                </span>
              ) : null}
            </div>
            <h2 id={`exhibit-${exhibit.id}-title`} className="text-xl font-bold leading-snug md:text-2xl">
              {exhibit.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--hall-muted)]">{exhibit.subtitle}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="gallery-icon-button shrink-0" aria-label="닫기">
            <X className="h-4 w-4" />
          </button>
        </header>

        <p className="mt-5 text-[15px] leading-7">{exhibit.summary}</p>

        {exhibit.role ? (
          <p className="mt-4 text-sm">
            <span className="mr-2 font-semibold text-[var(--hall-muted)]">역할</span>
            {exhibit.role}
          </p>
        ) : null}

        {exhibit.details.length > 0 ? (
          <ul className="mt-5 grid gap-2.5">
            {exhibit.details.map((detail) => (
              <li key={detail} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2.5 text-sm leading-6">
                <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] text-[var(--hall-accent)]" aria-hidden="true" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {exhibit.result ? (
          <p className="mt-5 rounded-lg border border-[var(--hall-line)] bg-[var(--hall-soft)] p-4 text-sm leading-6">
            <span className="mr-2 font-semibold">결과</span>
            {exhibit.result}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-1.5">
          {exhibit.tech.map((item) => (
            <span key={item} className="gallery-tag">
              {item}
            </span>
          ))}
        </div>

        {exhibit.images && exhibit.images.length > 0 ? (
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {exhibit.images.map((image) => (
              <figure
                key={image.src}
                className={cn(
                  "m-0 shrink-0 overflow-hidden rounded-lg border border-[var(--hall-line)]",
                  exhibit.imageLayout === "square" ? "w-44" : "w-32",
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={exhibit.imageLayout === "square" ? 352 : 256}
                  height={exhibit.imageLayout === "square" ? 352 : 398}
                  className={cn("w-full object-cover object-top", exhibit.imageLayout === "square" ? "aspect-square" : "aspect-[9/14]")}
                />
                <figcaption className="py-1.5 text-center text-[11px] font-semibold text-[var(--hall-muted)]">{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
