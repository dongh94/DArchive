"use client";

import { memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { Loader2, MessageCircle, Send } from "lucide-react";
import {
  guestbookCreateInputSchema,
  type GuestbookCreateInput,
} from "@darchive/api/schemas";
import { cn } from "@/shared/lib/cn";
import { trpc } from "@/shared/lib/trpc";
import { SectionHeader } from "./section-header";
import { GuestbookEntryCard } from "./guestbook-entry-card";

type GuestbookSectionProps = {
  onOpenViewer: () => void;
};

const PREVIEW_LIMIT = 3;
const PREVIEW_INPUT = { limit: PREVIEW_LIMIT } as const;
const VIEWER_INPUT = { limit: 20 } as const;
export const GuestbookSection = memo(function GuestbookSection({
  onOpenViewer,
}: GuestbookSectionProps) {
  const utils = trpc.useUtils();
  const previewQuery = trpc.wedding.guestbookList.useQuery(PREVIEW_INPUT);
  const countQuery = trpc.wedding.guestbookCount.useQuery();
  const createGuestbookEntry = trpc.wedding.guestbookCreate.useMutation({
    onSuccess: (entry) => {
      utils.wedding.guestbookList.setData(PREVIEW_INPUT, (current) => ({
        items: [entry, ...(current?.items ?? [])].slice(0, PREVIEW_LIMIT),
        nextCursor: current?.nextCursor ?? null,
      }));
      utils.wedding.guestbookList.invalidate();
      utils.wedding.guestbookCount.invalidate();
      form.reset();
      celebrateGuestbookEntry();
    },
  });

  const form = useForm<GuestbookCreateInput>({
    resolver: zodResolver(guestbookCreateInputSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { name: "", message: "", website: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createGuestbookEntry.mutateAsync(values).catch(() => {
      // error surfaced via createGuestbookEntry.error
    });
  });

  const previewEntries = previewQuery.data?.items ?? [];
  const totalCount = countQuery.data ?? 0;
  const errors = form.formState.errors;
  const submissionError = createGuestbookEntry.error?.message;
  const isNameConflict = createGuestbookEntry.error?.data?.code === "CONFLICT";
  const formMessage =
    submissionError ??
    (createGuestbookEntry.isSuccess ? "소중한 마음이 전해졌습니다." : null);
  const isError = Boolean(submissionError);
  const isNameInvalid = Boolean(errors.name) || isNameConflict;
  const isMessageInvalid = Boolean(errors.message);
  const prefetchViewerEntries = () => {
    void utils.wedding.guestbookList.prefetchInfinite(VIEWER_INPUT, {
      staleTime: 60_000,
    });
  };

  return (
    <section className="bg-brand-beige/10 px-6 py-20">
      <SectionHeader eyebrow="Guestbook" title="축하의 마음" description="따뜻한 한마디를 남겨주세요" />

      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <div className="space-y-1">
          <input
            type="text"
            {...form.register("name", {
              onChange: () => {
                if (createGuestbookEntry.error) createGuestbookEntry.reset();
              },
            })}
            maxLength={16}
            aria-invalid={isNameInvalid}
            aria-describedby={errors.name ? "guestbook-name-error" : undefined}
            className={cn(
              "w-full rounded-md border bg-white px-4 py-3 text-sm focus:outline-none",
              isNameInvalid
                ? "border-brand-ink/60 focus:border-brand-ink"
                : "border-brand-gold/20 focus:border-brand-gold",
            )}
            placeholder="성함"
            autoComplete="name"
          />
          <FieldError id="guestbook-name-error" message={errors.name?.message} />
        </div>
        <div className="space-y-1">
          <textarea
            {...form.register("message")}
            maxLength={300}
            rows={4}
            aria-invalid={isMessageInvalid}
            aria-describedby={errors.message ? "guestbook-message-error" : undefined}
            className={cn(
              "w-full resize-none rounded-md border bg-white px-4 py-3 text-sm leading-6 focus:outline-none",
              isMessageInvalid
                ? "border-brand-ink/60 focus:border-brand-ink"
                : "border-brand-gold/20 focus:border-brand-gold",
            )}
            placeholder="축하 메시지를 입력해주세요"
          />
          <FieldError id="guestbook-message-error" message={errors.message?.message} />
        </div>
        <input
          type="text"
          {...form.register("website")}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-8 py-4 text-sm font-medium text-white shadow-md transition-all hover:bg-brand-gold/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {form.formState.isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          마음 전하기
        </button>
        <AnimatePresence>
          {formMessage ? (
            <motion.p
              key={formMessage}
              role={isError ? "alert" : undefined}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={cn("text-center text-xs leading-5", isError ? "text-brand-ink" : "text-brand-muted")}
            >
              {formMessage}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </form>

      <div className="mt-10 space-y-3">
        {previewQuery.isPending ? (
          <div className="flex items-center justify-center py-8 text-brand-muted">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : null}
        {previewQuery.isError ? (
          <p className="rounded-lg border border-brand-gold/10 bg-white px-5 py-8 text-center text-xs text-brand-muted">
            방명록을 불러오지 못했습니다.
          </p>
        ) : null}
        {!previewQuery.isPending && !previewQuery.isError && previewEntries.length === 0 ? (
          <p className="rounded-lg border border-brand-gold/10 bg-white px-5 py-8 text-center text-xs text-brand-muted">
            아직 남겨진 메시지가 없습니다.
          </p>
        ) : null}
        <AnimatePresence initial={false}>
          {previewEntries.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <GuestbookEntryCard entry={entry} clampMessage />
            </motion.div>
          ))}
        </AnimatePresence>

        {totalCount > 0 ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenViewer}
              onFocus={prefetchViewerEntries}
              onPointerEnter={prefetchViewerEntries}
              onPointerDown={prefetchViewerEntries}
              onTouchStart={prefetchViewerEntries}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-gold/30 bg-white px-8 py-3.5 text-sm font-medium text-brand-gold shadow-sm transition-all hover:bg-brand-beige active:scale-95"
            >
              <MessageCircle size={16} />
              방명록 전체 보기
              <span className="text-brand-muted">({totalCount})</span>
            </button>
            <p className="text-center text-[11px] leading-5 text-brand-muted">
              방명록 수정은 전체 보기에서 가능합니다.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
});

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="px-1 text-xs text-brand-ink/75">
      {message}
    </p>
  ) : null;
}

function celebrateGuestbookEntry() {
  const brandColors = ["#C5A059", "#E8D5A8", "#F5F2ED", "#B98D4A"];
  confetti({
    particleCount: 36,
    spread: 70,
    startVelocity: 28,
    gravity: 0.9,
    ticks: 140,
    scalar: 0.85,
    origin: { y: 0.78 },
    colors: brandColors,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 14,
      spread: 110,
      startVelocity: 22,
      gravity: 0.7,
      ticks: 160,
      scalar: 0.7,
      origin: { y: 0.74 },
      colors: brandColors,
    });
  }, 140);
}
