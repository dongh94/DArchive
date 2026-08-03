import Link from "next/link";
import { CalendarDays, Download, Images, MessageSquareText, PartyPopper, RotateCcw, Search, Users } from "lucide-react";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import {
  deleteWeddingPhoto,
  deleteWeddingRsvp,
  setWeddingGuestbookVisibility,
  setWeddingPhotoVisibility,
  updateWeddingRsvp,
} from "../lib/wedding-actions";

type WeddingOverview = {
  pagination: {
    guestbook: PaginationState;
    photo: PaginationState;
    rsvp: PaginationState;
  };
  summary: {
    totalRsvps: number;
    attendingRsvps: number;
    declinedRsvps: number;
    expectedGuests: number;
    afterPartyYes: number;
    afterPartyNo: number;
    afterPartyUndecided: number;
    expectedAfterPartyGuests: number;
    visibleGuestbookCount: number;
    hiddenGuestbookCount: number;
    totalGuestbookCount: number;
    visiblePhotoCount: number;
    hiddenPhotoCount: number;
    totalPhotoCount: number;
  };
  rsvps: Array<{
    id: string;
    name: string;
    attendance: "YES" | "NO";
    guestCount: number | null;
    afterPartyAttendance: "YES" | "NO" | "UNDECIDED" | null;
    afterPartyGuestCount: number | null;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  guestbookEntries: Array<{
    id: string;
    name: string;
    message: string;
    isVisible: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  photos: Array<{
    id: string;
    uploaderName: string;
    publicUrl: string;
    isVisible: boolean;
    byteSize: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type WeddingAdminFilters = {
  afterParty?: string;
  attendance?: string;
  error?: string;
  guestbookPage?: string;
  photoPage?: string;
  q?: string;
  rsvpPage?: string;
};

const attendanceLabels = {
  YES: "참석",
  NO: "불참",
} as const;

const afterPartyLabels = {
  YES: "참석",
  NO: "불참",
  UNDECIDED: "미정",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeCsvCell(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function getPhoneDigits(value: string | null) {
  return value?.replace(/\D/g, "") ?? null;
}

function getLatestUpdatedAt(overview: WeddingOverview) {
  const timestamps = [...overview.rsvps, ...overview.guestbookEntries, ...overview.photos]
    .map((item) => new Date(item.updatedAt).getTime())
    .filter(Number.isFinite);

  return timestamps.length > 0 ? formatDate(new Date(Math.max(...timestamps)).toISOString()) : "No records";
}

function createRsvpCsvHref(rsvps: WeddingOverview["rsvps"]) {
  const headers = ["name", "attendance", "guestCount", "afterPartyAttendance", "afterPartyGuestCount", "phone", "createdAt"];
  const rows = rsvps.map((rsvp) => [
    rsvp.name,
    attendanceLabels[rsvp.attendance],
    rsvp.attendance === "YES" ? rsvp.guestCount ?? 1 : "",
    rsvp.afterPartyAttendance ? afterPartyLabels[rsvp.afterPartyAttendance] : "",
    rsvp.afterPartyAttendance === "YES" ? rsvp.afterPartyGuestCount ?? 1 : "",
    getPhoneDigits(rsvp.phone),
    formatDate(rsvp.createdAt),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

export function WeddingAdminPage({
  filters,
  overview,
}: {
  filters?: WeddingAdminFilters;
  overview: WeddingOverview;
}) {
  const { summary } = overview;
  const rsvpCsvHref = createRsvpCsvHref(overview.rsvps);
  const latestUpdatedAt = getLatestUpdatedAt(overview);

  const stats = [
    {
      title: "RSVP",
      value: summary.totalRsvps,
      detail: `${summary.attendingRsvps} attending / ${summary.declinedRsvps} declined`,
      icon: Users,
      accent: "text-[#4285f4]",
    },
    {
      title: "Expected Guests",
      value: summary.expectedGuests,
      detail: "Based on attending RSVP guest counts",
      icon: CalendarDays,
      accent: "text-[#34a853]",
    },
    {
      title: "After Party",
      value: summary.expectedAfterPartyGuests,
      detail: `${summary.afterPartyYes} yes / ${summary.afterPartyNo} no / ${summary.afterPartyUndecided} undecided`,
      icon: PartyPopper,
      accent: "text-[#fbbc05]",
    },
    {
      title: "Guestbook",
      value: summary.totalGuestbookCount,
      detail: `${summary.visibleGuestbookCount} visible / ${summary.hiddenGuestbookCount} hidden`,
      icon: MessageSquareText,
      accent: "text-[#ea4335]",
    },
    {
      title: "Guest Photos",
      value: summary.totalPhotoCount,
      detail: `${summary.visiblePhotoCount} visible / ${summary.hiddenPhotoCount} hidden`,
      icon: Images,
      accent: "text-[#4285f4]",
    },
  ] as const;

  return (
    <div className="grid gap-8">
      {filters?.error === "rsvp-update" ? (
        <p className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <span>RSVP를 저장하지 못했습니다. 입력값을 확인한 뒤 다시 시도해주세요.</span>
          <Link href="/admin/wedding" className="underline underline-offset-2">
            닫기
          </Link>
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article key={stat.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-foreground/55">{stat.title}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className={`h-4 w-4 ${stat.accent}`} />
                </span>
              </div>
              <p className="font-display text-3xl font-bold tracking-tight">{stat.value.toLocaleString("ko-KR")}</p>
              <p className="mt-2 text-xs font-semibold text-foreground/45">{stat.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">RSVP</h2>
            <p className="mt-1 text-sm text-foreground/50">
              {overview.pagination.rsvp.totalItems.toLocaleString("ko-KR")} filtered responses · page {overview.pagination.rsvp.page.toLocaleString("ko-KR")} / {overview.pagination.rsvp.totalPages.toLocaleString("ko-KR")}
            </p>
            <p className="mt-1 text-xs font-semibold text-foreground/35">Last updated {latestUpdatedAt}</p>
          </div>
          <a
            href={rsvpCsvHref}
            download="wedding-rsvp.csv"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-3 text-sm font-semibold transition hover:bg-border"
          >
            <Download className="h-4 w-4" />
            Page CSV
          </a>
        </div>
        <form action="/admin/wedding" className="grid gap-3 border-b border-border bg-muted/20 p-5 lg:grid-cols-[minmax(220px,1fr)_160px_180px_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search RSVP</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
            <input
              name="q"
              defaultValue={filters?.q ?? ""}
              placeholder="Search name or phone"
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none transition focus:border-[#4285f4]"
            />
          </label>
          <label>
            <span className="sr-only">Attendance</span>
            <select
              name="attendance"
              defaultValue={filters?.attendance ?? ""}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none transition focus:border-[#4285f4]"
            >
              <option value="">All attendance</option>
              <option value="YES">Attending</option>
              <option value="NO">Declined</option>
            </select>
          </label>
          <label>
            <span className="sr-only">After party</span>
            <select
              name="afterParty"
              defaultValue={filters?.afterParty ?? ""}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none transition focus:border-[#4285f4]"
            >
              <option value="">All after party</option>
              <option value="YES">After party yes</option>
              <option value="NO">After party no</option>
              <option value="UNDECIDED">After party undecided</option>
            </select>
          </label>
          <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            <Search className="h-4 w-4" />
            Filter
          </button>
          <Link href="/admin/wedding" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold transition hover:bg-muted">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Link>
        </form>
        <div className="divide-y divide-border">
          {overview.rsvps.length > 0 ? (
            overview.rsvps.map((rsvp) => (
              <details key={rsvp.id} className="group">
                <summary className="grid cursor-pointer list-none gap-3 p-5 transition hover:bg-muted/30 md:grid-cols-[minmax(120px,1.2fr)_100px_100px_140px_150px_88px] md:items-center">
                  <div>
                    <p className="font-semibold">{rsvp.name}</p>
                    <p className="mt-1 text-xs text-foreground/40">{formatDate(rsvp.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold">{attendanceLabels[rsvp.attendance]}</span>
                  <span className="text-sm text-foreground/60">{rsvp.attendance === "YES" ? `${rsvp.guestCount ?? 1}명` : "-"}</span>
                  <span className="text-sm text-foreground/60">
                    {rsvp.afterPartyAttendance ? afterPartyLabels[rsvp.afterPartyAttendance] : "-"}
                    {rsvp.afterPartyAttendance === "YES" ? ` / ${rsvp.afterPartyGuestCount ?? 1}명` : ""}
                  </span>
                  <span className="text-sm text-foreground/60">{getPhoneDigits(rsvp.phone) ?? "-"}</span>
                  <span className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground/60 transition group-open:bg-primary group-open:text-primary-foreground">
                    Edit
                  </span>
                </summary>
                <div className="border-t border-border bg-muted/20 p-5">
                  <form action={updateWeddingRsvp} className="grid gap-4 xl:grid-cols-[minmax(140px,1fr)_120px_110px_150px_110px_150px_auto] xl:items-end">
                    <input type="hidden" name="id" value={rsvp.id} />
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">Name</span>
                      <input
                        name="name"
                        defaultValue={rsvp.name}
                        maxLength={16}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-[#4285f4]"
                        required
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">Attendance</span>
                      <select
                        name="attendance"
                        defaultValue={rsvp.attendance}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-[#4285f4]"
                      >
                        <option value="YES">참석</option>
                        <option value="NO">불참</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">Guests</span>
                      <input
                        name="guestCount"
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={rsvp.attendance === "YES" ? rsvp.guestCount ?? 1 : ""}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-[#4285f4]"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">After Party</span>
                      <select
                        name="afterPartyAttendance"
                        defaultValue={rsvp.afterPartyAttendance ?? "UNDECIDED"}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-[#4285f4]"
                      >
                        <option value="YES">참석</option>
                        <option value="NO">불참</option>
                        <option value="UNDECIDED">미정</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">After Count</span>
                      <input
                        name="afterPartyGuestCount"
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={rsvp.afterPartyAttendance === "YES" ? rsvp.afterPartyGuestCount ?? 1 : ""}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-[#4285f4]"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">Phone</span>
                      <input
                        name="phone"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={11}
                        defaultValue={getPhoneDigits(rsvp.phone) ?? ""}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-[#4285f4]"
                      />
                    </label>
                    <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                      Save
                    </button>
                  </form>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/45">
                    <span>Updated {formatDate(rsvp.updatedAt)}</span>
                    <form action={deleteWeddingRsvp}>
                      <input type="hidden" name="id" value={rsvp.id} />
                      <ConfirmSubmitButton
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 px-3 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                        message={`${rsvp.name}님의 RSVP를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </details>
            ))
          ) : (
            <p className="p-10 text-center text-sm text-foreground/45">조건에 맞는 RSVP 응답이 없습니다.</p>
          )}
        </div>
        <PaginationControls filters={filters} pageKey="rsvpPage" pagination={overview.pagination.rsvp} />
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="font-display text-2xl font-bold tracking-tight">Guestbook</h2>
          <p className="mt-1 text-sm text-foreground/50">
            {overview.pagination.guestbook.totalItems.toLocaleString("ko-KR")} messages · page {overview.pagination.guestbook.page.toLocaleString("ko-KR")} / {overview.pagination.guestbook.totalPages.toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="divide-y divide-border">
          {overview.guestbookEntries.length > 0 ? (
            overview.guestbookEntries.map((entry) => (
              <article key={entry.id} className="grid gap-4 p-5 md:grid-cols-[180px_minmax(0,1fr)_180px]">
                <div>
                  <p className="font-semibold">{entry.name}</p>
                  <p className="mt-1 text-xs text-foreground/45">{formatDate(entry.createdAt)}</p>
                </div>
                <p className="min-w-0 whitespace-pre-line text-sm leading-6 text-foreground/70">{entry.message}</p>
                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${entry.isVisible ? "bg-[#34a853]/10 text-[#1f7a3f]" : "bg-muted text-foreground/45"}`}>
                    {entry.isVisible ? "Visible" : "Hidden"}
                  </span>
                  <form action={setWeddingGuestbookVisibility}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="isVisible" value={entry.isVisible ? "false" : "true"} />
                    <button
                      type="submit"
                      className="inline-flex rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold transition hover:bg-muted"
                    >
                      {entry.isVisible ? "Hide" : "Restore"}
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <p className="p-10 text-center text-sm text-foreground/45">아직 방명록이 없습니다.</p>
          )}
        </div>
        <PaginationControls filters={filters} pageKey="guestbookPage" pagination={overview.pagination.guestbook} />
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="font-display text-2xl font-bold tracking-tight">Guest Photos</h2>
          <p className="mt-1 text-sm text-foreground/50">
            {overview.pagination.photo.totalItems.toLocaleString("ko-KR")} photos · page {overview.pagination.photo.page.toLocaleString("ko-KR")} /{" "}
            {overview.pagination.photo.totalPages.toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {overview.photos.length > 0 ? (
            overview.photos.map((photo) => (
              <article key={photo.id} className="overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.publicUrl} alt={`${photo.uploaderName} photo`} className="aspect-square w-full object-cover" />
                <div className="space-y-3 p-4">
                  <div>
                    <p className="font-semibold">{photo.uploaderName}</p>
                    <p className="mt-1 text-xs text-foreground/45">{formatDate(photo.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                        photo.isVisible ? "bg-[#34a853]/10 text-[#1f7a3f]" : "bg-muted text-foreground/45"
                      }`}
                    >
                      {photo.isVisible ? "Visible" : "Hidden"}
                    </span>
                    <form action={setWeddingPhotoVisibility}>
                      <input type="hidden" name="id" value={photo.id} />
                      <input type="hidden" name="isVisible" value={photo.isVisible ? "false" : "true"} />
                      <button
                        type="submit"
                        className="inline-flex rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold transition hover:bg-muted"
                      >
                        {photo.isVisible ? "Hide" : "Restore"}
                      </button>
                    </form>
                    <form action={deleteWeddingPhoto}>
                      <input type="hidden" name="id" value={photo.id} />
                      <ConfirmSubmitButton
                        className="inline-flex rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                        message={`${photo.uploaderName}님의 사진을 삭제할까요?`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="col-span-full p-10 text-center text-sm text-foreground/45">아직 하객 사진이 없습니다.</p>
          )}
        </div>
        <PaginationControls filters={filters} pageKey="photoPage" pagination={overview.pagination.photo} />
      </section>
    </div>
  );
}

function getPaginationHref(
  filters: WeddingAdminFilters | undefined,
  pageKey: "guestbookPage" | "photoPage" | "rsvpPage",
  page: number,
) {
  const params = new URLSearchParams();

  if (filters?.q) params.set("q", filters.q);
  if (filters?.attendance) params.set("attendance", filters.attendance);
  if (filters?.afterParty) params.set("afterParty", filters.afterParty);
  if (filters?.guestbookPage && pageKey !== "guestbookPage") params.set("guestbookPage", filters.guestbookPage);
  if (filters?.photoPage && pageKey !== "photoPage") params.set("photoPage", filters.photoPage);
  if (filters?.rsvpPage && pageKey !== "rsvpPage") params.set("rsvpPage", filters.rsvpPage);

  if (page > 1) {
    params.set(pageKey, String(page));
  }

  const query = params.toString();

  return query ? `/admin/wedding?${query}` : "/admin/wedding";
}

function PaginationControls({
  filters,
  pageKey,
  pagination,
}: {
  filters?: WeddingAdminFilters;
  pageKey: "guestbookPage" | "photoPage" | "rsvpPage";
  pagination: PaginationState;
}) {
  const previousPage = Math.max(1, pagination.page - 1);
  const nextPage = Math.min(pagination.totalPages, pagination.page + 1);

  return (
    <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-foreground/50">
        Showing {pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}-
        {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems.toLocaleString("ko-KR")}
      </p>
      <div className="flex gap-2">
        <Link
          href={getPaginationHref(filters, pageKey, previousPage)}
          aria-disabled={pagination.page <= 1}
          className={`inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition ${
            pagination.page <= 1 ? "pointer-events-none bg-muted text-foreground/30" : "bg-card hover:bg-muted"
          }`}
        >
          Previous
        </Link>
        <Link
          href={getPaginationHref(filters, pageKey, nextPage)}
          aria-disabled={pagination.page >= pagination.totalPages}
          className={`inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition ${
            pagination.page >= pagination.totalPages ? "pointer-events-none bg-muted text-foreground/30" : "bg-card hover:bg-muted"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
