"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MessageCircle, Pencil, Reply, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { trpc } from "@/shared/lib/trpc";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { readStoredUploaderName, storeUploaderName } from "../utils/uploader-name";

type GuestbookCommentsDialogProps = {
  guestbookEntryId: string;
  onClose: () => void;
};

type CommentTarget = {
  id: string;
  name: string;
  message: string;
};

type EditTarget = CommentTarget & {
  confirmNameInput: string;
  nextName: string;
  isConfirmed: boolean;
};

type CommentFormState = {
  name: string;
  message: string;
};

const emptyForm = (): CommentFormState => ({
  name: readStoredUploaderName(),
  message: "",
});

export function GuestbookCommentsDialog({
  guestbookEntryId,
  onClose,
}: GuestbookCommentsDialogProps) {
  useBodyScrollLock();

  const utils = trpc.useUtils();
  const [commentForm, setCommentForm] = useState<CommentFormState>(emptyForm);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<CommentTarget | null>(null);
  const [replyForm, setReplyForm] = useState<CommentFormState>(emptyForm);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(
    () => new Set(),
  );

  const detailQuery = trpc.wedding.guestbookCommentList.useQuery({
    guestbookEntryId,
  });
  const createMutation = trpc.wedding.guestbookCommentCreate.useMutation({
    onSuccess: async (_comment, variables) => {
      setCommentForm((current) => ({ ...current, message: "" }));
      setIsCommentFormOpen(false);
      setReplyTarget(null);
      setReplyForm(emptyForm());
      const parentId = variables.parentId;
      if (parentId) {
        setExpandedCommentIds((current) => {
          const next = new Set(current);
          next.delete(parentId);
          return next;
        });
      }
      await Promise.all([
        utils.wedding.guestbookCommentList.invalidate({ guestbookEntryId }),
        utils.wedding.guestbookList.invalidate(),
      ]);
    },
  });
  const updateMutation = trpc.wedding.guestbookCommentUpdate.useMutation({
    onSuccess: async () => {
      setEditTarget(null);
      await utils.wedding.guestbookCommentList.invalidate({ guestbookEntryId });
    },
  });

  const submitComment = (parentId?: string) => {
    const form = parentId ? replyForm : commentForm;
    const name = form.name.trim();
    const message = form.message.trim();

    if (!name || !message) return;
    storeUploaderName(name);
    createMutation.mutate({
      guestbookEntryId,
      parentId,
      name,
      message,
      website: "",
    });
  };

  const requestEdit = (target: CommentTarget) => {
    updateMutation.reset();
    setReplyTarget(null);
    setIsCommentFormOpen(false);
    setEditTarget((current) =>
      current && current.id === target.id
        ? null
        : {
            ...target,
            confirmNameInput: "",
            nextName: target.name,
            isConfirmed: false,
          },
    );
  };

  const confirmEditName = () => {
    if (!editTarget || editTarget.confirmNameInput.trim() !== editTarget.name) return;
    updateMutation.reset();
    setEditTarget({ ...editTarget, isConfirmed: true });
  };

  const submitEdit = () => {
    if (!editTarget) return;
    updateMutation.mutate({
      id: editTarget.id,
      name: editTarget.confirmNameInput.trim(),
      nextName: editTarget.nextName,
      message: editTarget.message,
      website: "",
    });
  };

  const toggleReplies = (commentId: string) => {
    setExpandedCommentIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center overscroll-none px-5 py-4">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
        aria-label="댓글 보기 배경 닫기"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative flex h-[82dvh] min-h-[500px] max-h-[calc(100dvh-2rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="방명록 댓글"
      >
        <header className="flex items-center justify-between border-b border-brand-gold/10 px-5 py-4">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-brand-gold">Comments</p>
            <h3 className="font-serif text-lg text-brand-ink">방명록 댓글</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-brand-muted hover:text-brand-ink"
            aria-label="댓글 보기 닫기"
          >
            <X size={22} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-brand-beige/10 px-5 py-4">
          {detailQuery.isPending ? (
            <div className="flex items-center justify-center py-12 text-brand-muted">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : detailQuery.isError ? (
            <p className="rounded-lg border border-brand-gold/10 bg-white px-5 py-8 text-center text-xs text-brand-muted">
              댓글을 불러오지 못했습니다.
            </p>
          ) : (
            <div className="space-y-4">
              <article className="rounded-lg border border-brand-gold/15 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="min-w-0 truncate text-sm font-medium text-brand-ink">
                    {detailQuery.data.entry.name}
                  </h4>
                  <time className="shrink-0 text-[10px] text-brand-muted" dateTime={detailQuery.data.entry.createdAt}>
                    {formatCommentDate(detailQuery.data.entry.createdAt)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-brand-muted [overflow-wrap:anywhere]">
                  {detailQuery.data.entry.message}
                </p>
                <p className="mt-3 text-[11px] font-medium text-brand-gold">
                  댓글 {detailQuery.data.entry.commentCount.toLocaleString("ko-KR")}개
                </p>
              </article>

              {isCommentFormOpen ? (
                <CommentWriteForm
                  form={commentForm}
                  title="댓글 남기기"
                  submitLabel="댓글 등록"
                  isSubmitting={createMutation.isPending && !replyTarget}
                  errorMessage={!replyTarget ? createMutation.error?.message ?? null : null}
                  onChangeName={(value) => setCommentForm((current) => ({ ...current, name: value }))}
                  onChangeMessage={(value) => setCommentForm((current) => ({ ...current, message: value }))}
                  onCancel={() => {
                    setIsCommentFormOpen(false);
                    setCommentForm(emptyForm());
                    createMutation.reset();
                  }}
                  onSubmit={() => submitComment()}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    createMutation.reset();
                    setEditTarget(null);
                    setReplyTarget(null);
                    setIsCommentFormOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-gold/25 bg-white px-4 py-3 text-sm font-medium text-brand-ink shadow-sm transition hover:border-brand-gold/45 hover:bg-brand-beige/40"
                >
                  <MessageCircle size={16} />
                  댓글 남기기
                </button>
              )}

              {detailQuery.data.comments.length > 0 ? (
                <div className="space-y-3">
                  {detailQuery.data.comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      {(() => {
                        const isExpanded = expandedCommentIds.has(comment.id);

                        return (
                          <>
                      <CommentItem
                        comment={comment}
                        replyCount={comment.replies.length}
                        isExpanded={isExpanded}
                        onReply={() => {
                          setEditTarget(null);
                          setIsCommentFormOpen(false);
                          setReplyTarget(comment);
                          setReplyForm(emptyForm());
                        }}
                        onEdit={() => requestEdit(comment)}
                        onToggleReplies={
                          comment.replies.length > 0
                            ? () => toggleReplies(comment.id)
                            : undefined
                        }
                      />
                      {editTarget?.id === comment.id ? (
                        <EditCommentForm
                          target={editTarget}
                          isSubmitting={updateMutation.isPending}
                          errorMessage={updateMutation.error?.message ?? null}
                          onCancel={() => {
                            setEditTarget(null);
                            updateMutation.reset();
                          }}
                          onChangeConfirmName={(value) =>
                            setEditTarget((current) =>
                              current && current.id === comment.id
                                ? { ...current, confirmNameInput: value }
                                : current,
                            )
                          }
                          onConfirmName={confirmEditName}
                          onChangeNextName={(value) =>
                            setEditTarget((current) =>
                              current && current.id === comment.id
                                ? { ...current, nextName: value }
                                : current,
                            )
                          }
                          onChangeMessage={(value) =>
                            setEditTarget((current) =>
                              current && current.id === comment.id
                                ? { ...current, message: value }
                                : current,
                            )
                          }
                          onSubmit={submitEdit}
                        />
                      ) : null}

                      {replyTarget?.id === comment.id ? (
                        <div className="ml-5 border-l border-brand-gold/20 pl-3">
                          <CommentWriteForm
                            form={replyForm}
                            title={`${comment.name}님께 답글`}
                            submitLabel="답글 등록"
                            isSubmitting={createMutation.isPending}
                            errorMessage={createMutation.error?.message ?? null}
                            onChangeName={(value) => setReplyForm((current) => ({ ...current, name: value }))}
                            onChangeMessage={(value) => setReplyForm((current) => ({ ...current, message: value }))}
                            onCancel={() => setReplyTarget(null)}
                            onSubmit={() => submitComment(comment.id)}
                          />
                        </div>
                      ) : null}

                      {comment.replies.length > 0 && isExpanded ? (
                        <div className="ml-5 space-y-2 border-l border-brand-gold/20 pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="space-y-2">
                              <CommentItem
                                comment={reply}
                                isReply
                                onEdit={() => requestEdit(reply)}
                              />
                              {editTarget?.id === reply.id ? (
                                <EditCommentForm
                                  target={editTarget}
                                  isSubmitting={updateMutation.isPending}
                                  errorMessage={updateMutation.error?.message ?? null}
                                  onCancel={() => {
                                    setEditTarget(null);
                                    updateMutation.reset();
                                  }}
                                  onChangeConfirmName={(value) =>
                                    setEditTarget((current) =>
                                      current && current.id === reply.id
                                        ? { ...current, confirmNameInput: value }
                                        : current,
                                    )
                                  }
                                  onConfirmName={confirmEditName}
                                  onChangeNextName={(value) =>
                                    setEditTarget((current) =>
                                      current && current.id === reply.id
                                        ? { ...current, nextName: value }
                                        : current,
                                    )
                                  }
                                  onChangeMessage={(value) =>
                                    setEditTarget((current) =>
                                      current && current.id === reply.id
                                        ? { ...current, message: value }
                                        : current,
                                    )
                                  }
                                  onSubmit={submitEdit}
                                />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-brand-gold/10 bg-white px-5 py-8 text-center text-xs text-brand-muted">
                  아직 댓글이 없습니다.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function CommentItem({
  comment,
  isReply = false,
  replyCount = 0,
  isExpanded = false,
  onReply,
  onEdit,
  onToggleReplies,
}: {
  comment: CommentTarget & { createdAt: string };
  isReply?: boolean;
  replyCount?: number;
  isExpanded?: boolean;
  onReply?: () => void;
  onEdit: () => void;
  onToggleReplies?: () => void;
}) {
  const bodyContent = (
    <>
      <p className="whitespace-pre-wrap break-words text-left text-sm leading-6 text-brand-muted [overflow-wrap:anywhere]">
        {comment.message}
      </p>
      {!isReply && replyCount > 0 ? (
        <p className="mt-2 text-left text-[11px] font-medium text-brand-gold">
          답글 {replyCount.toLocaleString("ko-KR")}개 {isExpanded ? "접기" : "보기"}
        </p>
      ) : null}
    </>
  );

  return (
    <article className={cn("rounded-lg border border-brand-gold/10 bg-white p-4", isReply && "bg-white/80")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brand-ink">{comment.name}</p>
          <time className="text-[10px] text-brand-muted" dateTime={comment.createdAt}>
            {formatCommentDate(comment.createdAt)}
          </time>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onReply ? (
            <button
              type="button"
              onClick={onReply}
              className="flex h-7 w-7 items-center justify-center rounded-full text-brand-gold transition hover:bg-brand-beige hover:text-brand-ink"
              aria-label={`${comment.name}님 댓글에 답글`}
            >
              <Reply size={14} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-full text-brand-gold transition hover:bg-brand-beige hover:text-brand-ink"
            aria-label={`${comment.name}님 댓글 수정`}
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
      {onToggleReplies ? (
        <button
          type="button"
          onClick={onToggleReplies}
          aria-expanded={isExpanded}
          aria-label={`${comment.name}님 댓글 답글 ${replyCount}개 ${isExpanded ? "접기" : "보기"}`}
          className="block w-full"
        >
          {bodyContent}
        </button>
      ) : (
        bodyContent
      )}
    </article>
  );
}

function CommentWriteForm({
  form,
  title,
  submitLabel,
  isSubmitting,
  errorMessage,
  onChangeName,
  onChangeMessage,
  onCancel,
  onSubmit,
}: {
  form: CommentFormState;
  title: string;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onChangeName: (value: string) => void;
  onChangeMessage: (value: string) => void;
  onCancel?: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = form.name.trim().length > 0 && form.message.trim().length >= 2 && !isSubmitting;

  return (
    <div className="space-y-2 rounded-lg border border-brand-gold/15 bg-brand-beige/40 p-3">
      <p className="text-xs font-semibold text-brand-ink">{title}</p>
      <input
        type="text"
        value={form.name}
        onChange={(event) => onChangeName(event.target.value)}
        maxLength={16}
        placeholder="성함"
        autoComplete="name"
        disabled={isSubmitting}
        className="w-full rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm focus:border-brand-gold focus:outline-none disabled:opacity-60"
      />
      <textarea
        value={form.message}
        onChange={(event) => onChangeMessage(event.target.value)}
        maxLength={300}
        rows={3}
        placeholder="댓글을 입력해주세요"
        disabled={isSubmitting}
        className="w-full resize-none rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm leading-6 focus:border-brand-gold focus:outline-none disabled:opacity-60"
      />
      <div className={cn("grid gap-2", onCancel ? "grid-cols-2" : "grid-cols-1")}>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full border border-brand-gold/20 bg-white px-3 py-2 text-xs text-brand-muted hover:text-brand-ink disabled:opacity-60"
          >
            취소
          </button>
        ) : null}
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
          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
          {submitLabel}
        </button>
      </div>
      {errorMessage ? <p className="text-[11px] text-brand-ink/75">{errorMessage}</p> : null}
    </div>
  );
}

function EditCommentForm({
  target,
  isSubmitting,
  errorMessage,
  onChangeConfirmName,
  onConfirmName,
  onChangeNextName,
  onChangeMessage,
  onCancel,
  onSubmit,
}: {
  target: EditTarget;
  isSubmitting: boolean;
  errorMessage: string | null;
  onChangeConfirmName: (value: string) => void;
  onConfirmName: () => void;
  onChangeNextName: (value: string) => void;
  onChangeMessage: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const confirmName = target.confirmNameInput.trim();
  const nextName = target.nextName.trim().replace(/\s+/g, " ");
  const message = target.message.trim().replace(/\s+/g, " ");
  const isConfirmNameMatched = confirmName.length > 0 && confirmName === target.name;
  const isCompleteMismatch = confirmName.length >= target.name.trim().length && !isConfirmNameMatched;
  const confirmError = isCompleteMismatch ? "작성자 성함과 일치하지 않습니다." : null;
  const nextNameError =
    nextName.length < 1
      ? "성함을 입력해주세요."
      : nextName.length > 16
        ? "성함은 16자 이내로 입력해주세요."
        : null;
  const messageError =
    message.length < 2
      ? "댓글은 2자 이상 입력해주세요."
      : message.length > 300
        ? "댓글은 300자 이내로 입력해주세요."
        : null;
  const canSubmit = target.isConfirmed && !nextNameError && !messageError && !isSubmitting;

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
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === "Enter") {
              event.preventDefault();
              if (isConfirmNameMatched) onConfirmName();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
          placeholder={target.name}
          maxLength={16}
          autoFocus
          className="w-full rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
        />
        {confirmError ? <p className="text-[11px] text-brand-ink/75">{confirmError}</p> : null}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-brand-gold/20 bg-white px-3 py-2 text-xs text-brand-muted hover:text-brand-ink"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirmName}
            disabled={!isConfirmNameMatched}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium transition-colors",
              isConfirmNameMatched
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
      <input
        type="text"
        value={target.nextName}
        onChange={(event) => onChangeNextName(event.target.value)}
        maxLength={16}
        autoFocus
        disabled={isSubmitting}
        className="w-full rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm focus:border-brand-gold focus:outline-none disabled:opacity-60"
      />
      {nextNameError ? <p className="text-[11px] text-brand-ink/75">{nextNameError}</p> : null}
      <textarea
        value={target.message}
        onChange={(event) => onChangeMessage(event.target.value)}
        maxLength={300}
        rows={3}
        disabled={isSubmitting}
        className="w-full resize-none rounded border border-brand-gold/20 bg-white px-3 py-2 text-sm leading-6 focus:border-brand-gold focus:outline-none disabled:opacity-60"
      />
      {messageError ? <p className="text-[11px] text-brand-ink/75">{messageError}</p> : null}
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

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}
