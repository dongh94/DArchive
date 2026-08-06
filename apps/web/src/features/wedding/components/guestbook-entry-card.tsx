import type { ReactNode } from "react";
import type { GuestbookEntry } from "@darchive/api/schemas";

type GuestbookEntryCardProps = {
  entry: GuestbookEntry;
  clampMessage?: boolean;
  actionSlot?: ReactNode;
  footerSlot?: ReactNode;
};

export function GuestbookEntryCard({
  entry,
  clampMessage = false,
  actionSlot,
  footerSlot,
}: GuestbookEntryCardProps) {
  return (
    <article className="rounded-lg border border-brand-gold/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="min-w-0 truncate text-sm font-medium text-brand-ink">{entry.name}</h4>
        <div className="flex shrink-0 items-center gap-2">
          <time className="text-[10px] text-brand-muted" dateTime={entry.createdAt}>
            {formatGuestbookDate(entry.createdAt)}
          </time>
          {actionSlot}
        </div>
      </div>
      <p
        className={`whitespace-pre-wrap break-words text-sm leading-7 text-brand-muted [overflow-wrap:anywhere] ${
          clampMessage ? "line-clamp-3" : ""
        }`}
      >
        {entry.message}
      </p>
      {footerSlot ? <div className="mt-4">{footerSlot}</div> : null}
    </article>
  );
}

function formatGuestbookDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
