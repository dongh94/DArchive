import type { ReactNode } from "react";
import type { GuestbookEntry } from "@darchive/api/schemas";

type GuestbookEntryCardProps = {
  entry: GuestbookEntry;
  clampMessage?: boolean;
  onOpenDetail?: () => void;
  actionSlot?: ReactNode;
  footerSlot?: ReactNode;
};

export function GuestbookEntryCard({
  entry,
  clampMessage = false,
  onOpenDetail,
  actionSlot,
  footerSlot,
}: GuestbookEntryCardProps) {
  const body = (
    <>
      <p
        className={`whitespace-pre-wrap break-words text-sm leading-7 text-brand-muted [overflow-wrap:anywhere] ${
          clampMessage ? "line-clamp-3" : ""
        }`}
      >
        {entry.message}
      </p>
      <p className="mt-3 text-[11px] font-medium text-brand-gold">
        댓글 {entry.commentCount.toLocaleString("ko-KR")}개
      </p>
    </>
  );

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
      {onOpenDetail ? (
        <button
          type="button"
          onClick={onOpenDetail}
          className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
        >
          {body}
        </button>
      ) : (
        body
      )}
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
