"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, Pencil, Search, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { trpc } from "@/shared/lib/trpc";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { GuestbookEntryCard } from "./guestbook-entry-card";

const SEARCH_DEBOUNCE_MS = 500;
const LIST_LIMIT = 20;

type GuestbookViewerDialogProps = {
  onClose: () => void;
};

type EditTarget = {
  id: string;
  originalName: string;
  confirmNameInput: string;
  nextName: string;
  message: string;
  isConfirmed: boolean;
};

export function GuestbookViewerDialog({ onClose }: GuestbookViewerDialogProps) {
  useBodyScrollLock();

  const utils = trpc.useUtils();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const isTypingSearch = searchInput.trim() !== debouncedSearch;
  const trimmedSearch = searchInput.trim();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const listInput = useMemo(
    () => ({ limit: LIST_LIMIT, search: debouncedSearch || undefined }),
    [debouncedSearch],
  );

  const listQuery = trpc.wedding.guestbookList.useInfiniteQuery(listInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const updateMutation = trpc.wedding.guestbookUpdate.useMutation({
    onSuccess: () => {
      setEditTarget(null);
      utils.wedding.guestbookList.invalidate();
    },
  });

  const entries = listQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isInitialLoading = listQuery.isPending;
  const isRefetchingSearch =
    !isInitialLoading && (isTypingSearch || (listQuery.isFetching && !listQuery.isFetchingNextPage));
  const isSearchEmpty = !isInitialLoading && !isRefetchingSearch && entries.length === 0;

  const handleRequestEdit = (entry: { id: string; name: string; message: string }) => {
    updateMutation.reset();
    setEditTarget((current) =>
      current && current.id === entry.id
        ? null
        : {
            id: entry.id,
            originalName: entry.name,
            confirmNameInput: "",
            nextName: entry.name,
            message: entry.message,
            isConfirmed: false,
          },
    );
  };

  const handleConfirmEditName = () => {
    if (!editTarget || editTarget.confirmNameInput.trim() !== editTarget.originalName) return;
    updateMutation.reset();
    setEditTarget({ ...editTarget, isConfirmed: true });
  };

  const handleSubmitEdit = () => {
    if (!editTarget) return;
    updateMutation.mutate({
      id: editTarget.id,
      name: editTarget.confirmNameInput.trim(),
      nextName: editTarget.nextName,
      message: editTarget.message,
      website: "",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overscroll-none px-5 py-4">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
        aria-label="방명록 보기 배경 닫기"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative flex h-[78dvh] min-h-[480px] max-h-[calc(100dvh-2rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-brand-gold/10 px-5 py-4">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-brand-gold">Guestbook</p>
            <h3 className="font-serif text-lg">방명록 전체 보기</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-brand-muted hover:text-brand-ink"
            aria-label="방명록 보기 닫기"
          >
            <X size={22} />
          </button>
        </header>

        <div className="border-b border-brand-gold/10 px-5 py-3">
          <label className="flex items-center gap-2 rounded-md border border-brand-gold/20 bg-brand-beige/30 px-3 py-2 focus-within:border-brand-gold">
            {isTypingSearch || (listQuery.isFetching && !listQuery.isFetchingNextPage && !isInitialLoading) ? (
              <Loader2 size={16} className="animate-spin text-brand-gold" />
            ) : (
              <Search size={16} className="text-brand-muted" />
            )}
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                if (editTarget) setEditTarget(null);
                if (updateMutation.error) updateMutation.reset();
              }}
              maxLength={80}
              placeholder="이름이나 메시지로 검색"
              className="w-full bg-transparent text-sm focus:outline-none"
              autoComplete="off"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  if (editTarget) setEditTarget(null);
                  if (updateMutation.error) updateMutation.reset();
                }}
                className="text-xs text-brand-muted hover:text-brand-ink"
                aria-label="검색어 지우기"
              >
                지우기
              </button>
            ) : null}
          </label>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-brand-beige/10 px-5 py-4">
          {isInitialLoading ? (
            <div className="flex items-center justify-center py-12 text-brand-muted">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : listQuery.isError ? (
            <p className="rounded-lg border border-brand-gold/10 bg-white px-5 py-8 text-center text-xs text-brand-muted">
              방명록을 불러오지 못했습니다.
            </p>
          ) : isSearchEmpty ? (
            <p className="rounded-lg border border-brand-gold/10 bg-white px-5 py-8 text-center text-xs text-brand-muted">
              {trimmedSearch ? `"${trimmedSearch}"에 해당하는 메시지가 없습니다.` : "아직 남겨진 메시지가 없습니다."}
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const isTargeted = editTarget?.id === entry.id;
                return (
                  <GuestbookEntryCard
                    key={entry.id}
                    entry={entry}
                    actionSlot={
                      <button
                        type="button"
                        onClick={() => handleRequestEdit(entry)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-brand-gold transition-colors hover:bg-brand-beige hover:text-brand-ink"
                        aria-label={`${entry.name}의 메시지 수정`}
                      >
                        <Pencil size={14} />
                      </button>
                    }
                    footerSlot={
                      isTargeted ? (
                        <EditGuestbookEntryForm
                          target={editTarget}
                          onCancel={() => {
                            setEditTarget(null);
                            updateMutation.reset();
                          }}
                          onChangeConfirmName={(value) =>
                            setEditTarget((current) =>
                              current && current.id === entry.id
                                ? { ...current, confirmNameInput: value }
                                : current,
                            )
                          }
                          onConfirmName={handleConfirmEditName}
                          onChangeNextName={(value) =>
                            setEditTarget((current) =>
                              current && current.id === entry.id
                                ? { ...current, nextName: value }
                                : current,
                            )
                          }
                          onChangeMessage={(value) =>
                            setEditTarget((current) =>
                              current && current.id === entry.id
                                ? { ...current, message: value }
                                : current,
                            )
                          }
                          onSubmit={handleSubmitEdit}
                          isSubmitting={updateMutation.isPending}
                          errorMessage={updateMutation.error?.message ?? null}
                        />
                      ) : null
                    }
                  />
                );
              })}
              {listQuery.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => listQuery.fetchNextPage()}
                  disabled={listQuery.isFetchingNextPage}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-gold/20 bg-white px-6 py-3 text-xs font-medium text-brand-muted transition-all hover:bg-brand-beige disabled:opacity-60"
                >
                  {listQuery.isFetchingNextPage ? <Loader2 size={14} className="animate-spin" /> : null}
                  더 불러오기
                </button>
              ) : entries.length > 0 ? (
                <p className="py-4 text-center text-[10px] uppercase tracking-widest text-brand-gold/60">— End —</p>
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

type EditGuestbookEntryFormProps = {
  target: EditTarget;
  onChangeConfirmName: (value: string) => void;
  onConfirmName: () => void;
  onChangeNextName: (value: string) => void;
  onChangeMessage: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
};

function EditGuestbookEntryForm({
  target,
  onChangeConfirmName,
  onConfirmName,
  onChangeNextName,
  onChangeMessage,
  onCancel,
  onSubmit,
  isSubmitting,
  errorMessage,
}: EditGuestbookEntryFormProps) {
  const trimmedConfirmName = target.confirmNameInput.trim();
  const trimmedNextName = target.nextName.trim().replace(/\s+/g, " ");
  const trimmedMessage = target.message.trim().replace(/\s+/g, " ");
  const isConfirmNameTooLong = trimmedConfirmName.length > 16;
  const isConfirmNameMatched =
    trimmedConfirmName.length > 0 && trimmedConfirmName === target.originalName;
  const isCompleteMismatch =
    trimmedConfirmName.length >= target.originalName.trim().length &&
    !isConfirmNameMatched;
  const nameValidationMessage = isConfirmNameTooLong
    ? "성함은 16자 이내로 입력해주세요."
    : isCompleteMismatch
      ? "작성자 성함과 일치하지 않습니다."
      : null;
  const editNameValidationMessage =
    trimmedNextName.length < 1
      ? "성함을 입력해주세요."
      : trimmedNextName.length > 16
        ? "성함은 16자 이내로 입력해주세요."
        : null;
  const messageValidationMessage =
    trimmedMessage.length < 2
      ? "축하 메시지는 2자 이상 입력해주세요."
      : trimmedMessage.length > 300
        ? "축하 메시지는 300자 이내로 입력해주세요."
        : null;
  const canConfirmName = isConfirmNameMatched && !isConfirmNameTooLong;
  const canSubmit =
    target.isConfirmed &&
    !editNameValidationMessage &&
    !messageValidationMessage &&
    !isSubmitting;

  if (!target.isConfirmed) {
    return (
      <div className="space-y-2 rounded-md border border-brand-gold/15 bg-brand-beige/40 p-3">
        <p className="text-[11px] leading-5 text-brand-muted">
          수정하려면 작성자 성함을 다시 입력해주세요.
        </p>
        <input
          type="text"
          value={target.confirmNameInput}
          onChange={(event) => onChangeConfirmName(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) {
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (canConfirmName) {
                onConfirmName();
              }
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
          placeholder={target.originalName}
          maxLength={16}
          autoFocus
          className="w-full rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm placeholder:text-brand-muted/50 focus:border-brand-gold focus:outline-none"
          aria-label="작성자 성함 확인"
          aria-invalid={Boolean(nameValidationMessage)}
          aria-describedby={nameValidationMessage ? "edit-name-error" : undefined}
        />
        {nameValidationMessage ? (
          <p id="edit-name-error" role="alert" className="text-[11px] text-brand-ink/75">
            {nameValidationMessage}
          </p>
        ) : null}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1.5 text-xs text-brand-muted hover:text-brand-ink"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirmName}
            disabled={!canConfirmName}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              canConfirmName
                ? "bg-brand-ink text-white hover:bg-brand-ink/90"
                : "bg-brand-beige text-brand-muted/50",
            )}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-brand-gold/15 bg-brand-beige/40 p-3">
      <p className="text-[11px] leading-5 text-brand-muted">
        성함과 축하 메시지를 수정할 수 있어요.
      </p>
      <label className="block space-y-1.5">
        <span className="text-[11px] font-medium text-brand-muted">성함</span>
        <input
          type="text"
          value={target.nextName}
          onChange={(event) => onChangeNextName(event.target.value)}
          maxLength={16}
          autoFocus
          disabled={isSubmitting}
          className="w-full rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm focus:border-brand-gold focus:outline-none disabled:opacity-60"
          aria-label="성함 수정"
          aria-invalid={Boolean(editNameValidationMessage)}
          aria-describedby={editNameValidationMessage ? "edit-next-name-error" : undefined}
        />
      </label>
      {editNameValidationMessage ? (
        <p id="edit-next-name-error" role="alert" className="text-[11px] text-brand-ink/75">
          {editNameValidationMessage}
        </p>
      ) : null}
      <textarea
        value={target.message}
        onChange={(event) => onChangeMessage(event.target.value)}
        maxLength={300}
        rows={4}
        disabled={isSubmitting}
        className="w-full resize-none rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm leading-6 focus:border-brand-gold focus:outline-none disabled:opacity-60"
        aria-label="축하 메시지 수정"
        aria-invalid={Boolean(messageValidationMessage)}
        aria-describedby={messageValidationMessage ? "edit-message-error" : undefined}
      />
      {messageValidationMessage ? (
        <p id="edit-message-error" role="alert" className="text-[11px] text-brand-ink/75">
          {messageValidationMessage}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full border border-brand-gold/20 bg-white px-3 py-2 text-xs text-brand-muted hover:text-brand-ink disabled:opacity-60"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors",
            canSubmit
              ? "bg-brand-ink text-white hover:bg-brand-ink/90"
              : "bg-brand-beige text-brand-muted/50",
          )}
        >
          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
          저장
        </button>
      </div>
      {errorMessage ? <p className="text-[11px] text-brand-ink/75">{errorMessage}</p> : null}
    </div>
  );
}
