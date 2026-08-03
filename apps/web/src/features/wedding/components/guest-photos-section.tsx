"use client";

/* eslint-disable @next/next/no-img-element -- Guest photos are remote Supabase URLs; lightbox controls decode/swipe like Gallery. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ImagePlus,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { trpc } from "@/shared/lib/trpc";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { uploadGuestPhoto } from "../lib/upload-guest-photo";
import { readStoredUploaderName, storeUploaderName } from "../utils/uploader-name";
const LIST_INPUT = { limit: 24 } as const;
const INITIAL_IMAGE_COUNT = 9;
const MAX_FILES_PER_BATCH = 30;
const MIN_SLIDE_TRANSITION_DURATION = 180;
const MAX_SLIDE_TRANSITION_DURATION = 320;

type GuestPhoto = {
  id: string;
  uploaderName: string;
  publicUrl: string;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
};

export function GuestPhotosSection() {
  const utils = trpc.useUtils();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const photoQuery = trpc.wedding.photoList.useInfiniteQuery(LIST_INPUT, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const countQuery = trpc.wedding.photoCount.useQuery();
  const isRefreshing = photoQuery.isRefetching || countQuery.isRefetching;

  const photos = useMemo(
    () => photoQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [photoQuery.data],
  );
  const totalCount = countQuery.data ?? photos.length;
  const lightboxPhotos = isExpanded ? photos : photos.slice(0, INITIAL_IMAGE_COUNT);
  const gridSlots = useMemo(() => {
    if (isExpanded) {
      return photos.map((photo) => photo);
    }

    return Array.from({ length: INITIAL_IMAGE_COUNT }, (_, index) => photos[index] ?? null);
  }, [isExpanded, photos]);

  const refreshPhotos = () => {
    void photoQuery.refetch();
    void countQuery.refetch();
  };

  const handleExpandToggle = () => {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded && photoQuery.hasNextPage) {
      void photoQuery.fetchNextPage();
    }
  };

  const handleUploaded = (created: GuestPhoto) => {
    utils.wedding.photoList.setInfiniteData(LIST_INPUT, (current) => {
      if (!current) {
        return {
          pages: [{ items: [created], nextCursor: null }],
          pageParams: [null],
        };
      }

      const [firstPage, ...restPages] = current.pages;
      return {
        ...current,
        pages: [
          {
            items: [created, ...(firstPage?.items ?? [])],
            nextCursor: firstPage?.nextCursor ?? null,
          },
          ...restPages,
        ],
      };
    });
    void utils.wedding.photoCount.invalidate();
  };

  return (
    <section id="guest-photos" className="flex flex-col px-5 pb-10 pt-8">
      <div className="mb-8 shrink-0 text-center">
        <h2 className="font-serif text-xl text-brand-ink">함께한 순간을 모아주세요</h2>
        <p className="mt-3 text-xs leading-6 text-brand-muted">
          따뜻한 시선으로 담아준 장면을 이곳에 남겨주시면
          <br />
          두 사람의 하루에 오래 남을 추억이 됩니다.
        </p>
        <p className="mt-2 text-[11px] leading-5 text-brand-muted/80">
          작은 순간도 괜찮아요. 마음 가는 대로 올려주세요.
        </p>
      </div>

      <div className="mb-5 grid h-11 shrink-0 grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex h-full items-center justify-center gap-1.5 rounded-md bg-brand-gold px-3 text-xs font-semibold tracking-[0.04em] text-white transition hover:bg-brand-gold/90"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          사진 올리기
        </button>
        <button
          type="button"
          onClick={refreshPhotos}
          disabled={isRefreshing}
          className="inline-flex h-full items-center justify-center gap-1.5 rounded-md border border-brand-gold/20 bg-white px-3 text-xs font-semibold tracking-[0.04em] text-brand-ink transition hover:bg-brand-beige/30 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          새 사진 불러오기
        </button>
      </div>

      <div className={cn("w-full", !isExpanded && "aspect-square shrink-0")}>
        <div
          className={cn(
            "grid grid-cols-3 gap-1.5",
            isExpanded ? "auto-rows-auto" : "h-full grid-rows-3",
          )}
        >
          {gridSlots.map((photo, index) =>
            photo ? (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "group relative overflow-hidden bg-brand-beige/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
                  isExpanded ? "aspect-square" : "h-full w-full",
                )}
                aria-label={`${photo.uploaderName}님 사진 크게 보기`}
              >
                <img
                  src={photo.publicUrl}
                  alt={`${photo.uploaderName}님이 올린 사진`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ) : (
              <div
                key={`empty-slot-${index}`}
                className={cn("bg-brand-beige/20", isExpanded ? "aspect-square" : "h-full w-full")}
                aria-hidden="true"
              />
            ),
          )}
        </div>
      </div>

      <div className="mt-6 flex min-h-8 shrink-0 flex-col items-center justify-start gap-2">
        {totalCount > INITIAL_IMAGE_COUNT || photos.length > INITIAL_IMAGE_COUNT ? (
          <button
            type="button"
            onClick={handleExpandToggle}
            className="flex items-center gap-1.5 border-b border-brand-gold/50 pb-1 text-xs tracking-[0.12em] text-brand-muted transition-colors hover:text-brand-gold"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                사진 접기
                <ChevronUp size={14} aria-hidden="true" />
              </>
            ) : (
              <>
                사진 더보기
                <ChevronDown size={14} aria-hidden="true" />
              </>
            )}
          </button>
        ) : (
          <p className="text-[11px] tracking-[0.08em] text-brand-muted/70">
            {photos.length === 0 ? "아직 올라온 사진이 없어요" : `${totalCount.toLocaleString("ko-KR")}장의 사진`}
          </p>
        )}

        {isExpanded && photoQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => void photoQuery.fetchNextPage()}
            disabled={photoQuery.isFetchingNextPage}
            className="flex items-center gap-1.5 text-xs tracking-[0.12em] text-brand-muted transition-colors hover:text-brand-gold disabled:opacity-60"
          >
            {photoQuery.isFetchingNextPage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            더 불러오기
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {selectedImageIndex !== null && lightboxPhotos.length > 0 ? (
          <GuestPhotosLightbox
            photos={lightboxPhotos}
            initialIndex={Math.min(selectedImageIndex, lightboxPhotos.length - 1)}
            onClose={() => setSelectedImageIndex(null)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isUploadOpen ? (
          <GuestPhotoUploadDialog
            onClose={() => setIsUploadOpen(false)}
            onUploaded={handleUploaded}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function GuestPhotoUploadDialog({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (photo: GuestPhoto) => void;
}) {
  useBodyScrollLock();

  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    setUploaderName(readStoredUploaderName());
  }, []);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // Only revoke on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const nextFiles = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, MAX_FILES_PER_BATCH - pendingFiles.length))
      .map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${Date.now()}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (nextFiles.length === 0) {
      return;
    }

    setPendingFiles((current) => [...current, ...nextFiles]);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleUpload = async () => {
    const trimmedName = uploaderName.trim();

    if (!trimmedName) {
      setNameError("사진을 올리려면 이름을 입력해주세요.");
      return;
    }

    if (trimmedName.length > 16) {
      setNameError("이름은 16자 이내로 입력해주세요.");
      return;
    }

    if (pendingFiles.length === 0) {
      setUploadError("올릴 사진을 선택해주세요.");
      return;
    }

    setNameError(null);
    setUploadError(null);
    storeUploaderName(trimmedName);
    setIsUploading(true);
    setUploadProgress({ done: 0, total: pendingFiles.length });

    let failedAt: number | null = null;

    for (let index = 0; index < pendingFiles.length; index += 1) {
      const item = pendingFiles[index];
      if (!item) continue;

      try {
        const created = await uploadGuestPhoto(utils.client as never, item.file, trimmedName);
        onUploaded(created);
        URL.revokeObjectURL(item.previewUrl);
        setUploadProgress({ done: index + 1, total: pendingFiles.length });
      } catch (error) {
        failedAt = index;
        setUploadError(error instanceof Error ? error.message : "업로드에 실패했습니다.");
        break;
      }
    }

    setIsUploading(false);

    if (failedAt === null) {
      setPendingFiles([]);
      setUploadProgress(null);
      onClose();
      return;
    }

    setPendingFiles(pendingFiles.slice(failedAt));
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overscroll-none px-5 py-4">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative z-10 flex max-h-[min(720px,calc(100dvh-32px))] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="하객 사진 올리기"
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-brand-gold/10 px-4">
          <p className="text-sm font-semibold text-brand-ink">사진 올리기</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-brand-beige"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-brand-muted">올린 분 이름</span>
            <input
              type="text"
              value={uploaderName}
              onChange={(event) => {
                setUploaderName(event.target.value);
                if (nameError) setNameError(null);
              }}
              maxLength={16}
              placeholder="성함"
              autoComplete="name"
              className={cn(
                "w-full rounded-md border bg-white px-4 py-3 text-sm focus:outline-none",
                nameError
                  ? "border-brand-ink/60 focus:border-brand-ink"
                  : "border-brand-gold/20 focus:border-brand-gold",
              )}
            />
          </label>
          {nameError ? <p className="text-xs text-brand-ink/75">{nameError}</p> : null}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || pendingFiles.length >= MAX_FILES_PER_BATCH}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-brand-gold/20 bg-brand-beige/20 px-4 text-sm font-semibold text-brand-ink transition hover:bg-brand-beige/40 disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            앨범에서 선택
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => addFiles(event.target.files)}
          />

          {pendingFiles.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {pendingFiles.map((item) => (
                <div key={item.id} className="relative aspect-square overflow-hidden bg-brand-beige/30">
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePendingFile(item.id)}
                    disabled={isUploading}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70 disabled:opacity-50"
                    aria-label="선택 사진 제거"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs leading-5 text-brand-muted">
              여러 장을 고른 뒤 아래에서 올릴 수 있어요.
            </p>
          )}

          {uploadError ? <p className="text-xs text-brand-ink/75">{uploadError}</p> : null}
          {uploadProgress ? (
            <p className="text-xs text-brand-muted">
              {uploadProgress.done}/{uploadProgress.total}장 업로드 중...
            </p>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-brand-gold/10 p-4">
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={isUploading || pendingFiles.length === 0}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-gold px-4 text-sm font-semibold text-white transition hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isUploading ? "올리는 중..." : `사진 올리기${pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ""}`}
          </button>
        </footer>
      </motion.div>
    </div>,
    document.body,
  );
}

function GuestPhotosLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: GuestPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(MAX_SLIDE_TRANSITION_DURATION);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerStartXRef = useRef(0);
  const pointerStartTimeRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const isTouchDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const transitionTimeoutRef = useRef<number | null>(null);
  const imageCount = photos.length;
  const currentPhoto = photos[selectedIndex];

  useBodyScrollLock();

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const completeTransition = useCallback(
    (nextIndex: number | null, duration: number) => {
      clearTransitionTimeout();
      transitionTimeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);

        if (nextIndex !== null) {
          setSelectedIndex(nextIndex);
        }

        dragOffsetRef.current = 0;
        setDragOffset(0);
        transitionTimeoutRef.current = null;
      }, duration);
    },
    [clearTransitionTimeout],
  );

  const navigate = useCallback(
    (direction: "previous" | "next") => {
      if (isAnimating || imageCount <= 1) {
        return;
      }

      const directionOffset = direction === "next" ? 1 : -1;
      const nextIndex = getWrappedIndex(selectedIndex + directionOffset, imageCount);
      const viewportWidth = viewportRef.current?.clientWidth ?? 410;
      const targetOffset = direction === "next" ? -viewportWidth : viewportWidth;
      const remainingDistance = Math.abs(targetOffset - dragOffsetRef.current);
      const duration = getSlideTransitionDuration(remainingDistance, viewportWidth);

      setTransitionDuration(duration);
      setIsAnimating(true);
      setDragOffset(targetOffset);
      completeTransition(nextIndex, duration);
    },
    [completeTransition, imageCount, isAnimating, selectedIndex],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        navigate("previous");
      } else if (event.key === "ArrowRight") {
        navigate("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, onClose]);

  useEffect(() => clearTransitionTimeout, [clearTransitionTimeout]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimating || event.pointerType !== "mouse" || imageCount <= 1) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStartXRef.current = event.clientX;
    pointerStartTimeRef.current = performance.now();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || activePointerIdRef.current !== event.pointerId || isAnimating) {
      return;
    }

    updateDragOffset(event.clientX);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || activePointerIdRef.current !== event.pointerId || isAnimating) {
      return;
    }

    activePointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isAnimating || event.touches.length !== 1 || imageCount <= 1) {
      return;
    }

    isTouchDraggingRef.current = true;
    pointerStartXRef.current = event.touches[0].clientX;
    pointerStartTimeRef.current = performance.now();
    dragOffsetRef.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchDraggingRef.current || isAnimating || event.touches.length !== 1) {
      return;
    }

    updateDragOffset(event.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isTouchDraggingRef.current || isAnimating) {
      return;
    }

    isTouchDraggingRef.current = false;
    finishDrag();
  };

  const updateDragOffset = (clientX: number) => {
    const viewportWidth = viewportRef.current?.clientWidth ?? 410;
    const nextOffset = clientX - pointerStartXRef.current;
    const boundedOffset = Math.max(-viewportWidth, Math.min(viewportWidth, nextOffset));

    dragOffsetRef.current = boundedOffset;
    setDragOffset(boundedOffset);
  };

  const finishDrag = () => {
    const finalDragOffset = dragOffsetRef.current;
    const elapsedTime = Math.max(performance.now() - pointerStartTimeRef.current, 1);
    const velocity = finalDragOffset / elapsedTime;
    const viewportWidth = viewportRef.current?.clientWidth ?? 410;
    const shouldNavigate =
      Math.abs(finalDragOffset) > viewportWidth * 0.14 || Math.abs(velocity) > 0.45;

    if (shouldNavigate && finalDragOffset !== 0) {
      navigate(finalDragOffset < 0 ? "next" : "previous");
      return;
    }

    setIsAnimating(true);
    const snapBackDuration = getSlideTransitionDuration(Math.abs(finalDragOffset), viewportWidth);
    setTransitionDuration(snapBackDuration);
    dragOffsetRef.current = 0;
    setDragOffset(0);
    completeTransition(null, snapBackDuration);
  };

  const slides = [-1, 0, 1].map((offset) => {
    const index = getWrappedIndex(selectedIndex + offset, imageCount);
    return {
      photo: photos[index],
      index,
    };
  });

  if (!currentPhoto) {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      className="fixed inset-0 z-[200] flex touch-none items-center justify-center overscroll-none bg-black/85 p-3 sm:p-6"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
        aria-label="사진 상세보기 배경 닫기"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="relative z-10 flex max-h-[calc(100dvh-24px)] w-[min(410px,calc(100vw-24px),calc((100dvh-136px)*0.75))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="하객 사진 상세보기"
      >
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
          <div className="min-w-0">
            <p className="truncate font-[Inter,ui-sans-serif,system-ui,sans-serif] text-xs font-semibold text-brand-ink">
              {currentPhoto.uploaderName}
            </p>
            <p className="mt-0.5 text-[10px] text-brand-muted">Live Photos</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[11px] font-medium text-brand-muted">
              {selectedIndex + 1}/{imageCount}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-brand-beige"
              aria-label="사진 상세보기 닫기"
            >
              <X size={21} />
            </button>
          </div>
        </header>

        <div className="relative bg-brand-beige/70">
          <div
            ref={viewportRef}
            className="aspect-[3/4] cursor-grab touch-pan-y overflow-hidden overscroll-contain active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div
              className="flex h-full w-full will-change-transform"
              style={{
                transform: `translate3d(calc(-100% + ${dragOffset}px), 0, 0)`,
                transition: isAnimating
                  ? `transform ${transitionDuration}ms cubic-bezier(0.25, 0.8, 0.25, 1)`
                  : "none",
              }}
            >
              {slides.map(({ photo, index }) => (
                <div
                  key={`${photo?.id ?? "empty"}-${index}`}
                  className="relative h-full w-full shrink-0 bg-brand-beige/70"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${imageCount}`}
                >
                  {photo ? (
                    <img
                      src={photo.publicUrl}
                      alt={`${photo.uploaderName}님이 올린 사진`}
                      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${
                        photo.height && photo.width && photo.height > photo.width
                          ? "object-cover"
                          : "object-contain"
                      }`}
                      draggable={false}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {imageCount > 1 ? (
            <>
              <LightboxNavigationButton direction="previous" onClick={() => navigate("previous")} />
              <LightboxNavigationButton direction="next" onClick={() => navigate("next")} />
            </>
          ) : null}
        </div>

        <footer className="flex h-14 shrink-0 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-brand-ink">지금 이 순간을 함께 모아보세요.</p>
            <p className="mt-0.5 text-[10px] text-brand-muted">옆으로 밀어 다음 사진을 볼 수 있어요</p>
          </div>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-brand-beige">
            <motion.div
              className="h-full origin-left bg-brand-gold"
              animate={{ scaleX: (selectedIndex + 1) / imageCount }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
        </footer>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function LightboxNavigationButton({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick: () => void;
}) {
  const isPrevious = direction === "previous";
  const Icon = isPrevious ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 active:scale-95 ${
        isPrevious ? "left-2.5" : "right-2.5"
      }`}
      aria-label={isPrevious ? "이전 사진" : "다음 사진"}
    >
      <Icon size={22} strokeWidth={1.8} />
    </button>
  );
}

function getWrappedIndex(index: number, imageCount: number) {
  return (index + imageCount) % imageCount;
}

function getSlideTransitionDuration(distance: number, viewportWidth: number) {
  const distanceRatio = Math.min(Math.max(distance / viewportWidth, 0), 1);

  return Math.round(
    MIN_SLIDE_TRANSITION_DURATION +
      (MAX_SLIDE_TRANSITION_DURATION - MIN_SLIDE_TRANSITION_DURATION) * distanceRatio,
  );
}
