"use client";

/* eslint-disable @next/next/no-img-element -- The lightbox preloads exact static variants and controls decode timing directly. */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from "lucide-react";
import { weddingContent } from "../data/wedding-content";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { SectionHeader } from "./section-header";

const INITIAL_IMAGE_COUNT = 9;
const MIN_SLIDE_TRANSITION_DURATION = 180;
const MAX_SLIDE_TRANSITION_DURATION = 320;
const galleryImagePromises = new Map<string, Promise<void>>();
const decodedGalleryImages = new Set<string>();

export function GallerySection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const visibleImages = isExpanded
    ? weddingContent.gallery
    : weddingContent.gallery.slice(0, INITIAL_IMAGE_COUNT);

  return (
    <section id="gallery" className="px-5 py-20">
      <SectionHeader eyebrow="Gallery" description="우리의 소중한 순간들" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="grid grid-cols-3 gap-1.5"
      >
        {visibleImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onPointerDown={() => warmGalleryImages(index)}
            onPointerEnter={() => warmGalleryImages(index)}
            onClick={() => setSelectedImageIndex(index)}
            className="group relative aspect-square overflow-hidden bg-brand-beige/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            aria-label={`${index + 1}번째 사진 크게 보기`}
          >
            <Image
              src={image.thumbnailSrc}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 420px) 31vw, 125px"
            />
          </button>
        ))}
      </motion.div>

      {weddingContent.gallery.length > INITIAL_IMAGE_COUNT ? (
        <button
          type="button"
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
          className="mx-auto mt-7 flex items-center gap-1.5 border-b border-brand-gold/50 pb-1 text-xs tracking-[0.12em] text-brand-muted transition-colors hover:text-brand-gold"
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
      ) : null}

      <AnimatePresence>
        {selectedImageIndex !== null ? (
          <GalleryLightbox
            initialIndex={selectedImageIndex}
            onClose={() => setSelectedImageIndex(null)}
            onIndexChange={setSelectedImageIndex}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function GalleryLightbox({
  initialIndex,
  onClose,
  onIndexChange,
}: {
  initialIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(
    MAX_SLIDE_TRANSITION_DURATION,
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerStartXRef = useRef(0);
  const pointerStartTimeRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const isTouchDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const transitionTimeoutRef = useRef<number | null>(null);
  const imageCount = weddingContent.gallery.length;

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
          onIndexChange(nextIndex);
        }

        dragOffsetRef.current = 0;
        setDragOffset(0);
        transitionTimeoutRef.current = null;
      }, duration);
    },
    [clearTransitionTimeout, onIndexChange],
  );

  const navigate = useCallback(
    (direction: "previous" | "next") => {
      if (isAnimating) {
        return;
      }

      const directionOffset = direction === "next" ? 1 : -1;
      const nextIndex = getWrappedIndex(selectedIndex + directionOffset, imageCount);
      const viewportWidth = viewportRef.current?.clientWidth ?? 410;
      const targetOffset = direction === "next" ? -viewportWidth : viewportWidth;
      const remainingDistance = Math.abs(
        targetOffset - dragOffsetRef.current,
      );
      const duration = getSlideTransitionDuration(
        remainingDistance,
        viewportWidth,
      );

      warmGalleryImages(nextIndex);
      setTransitionDuration(duration);
      setIsAnimating(true);
      setDragOffset(targetOffset);
      completeTransition(nextIndex, duration);
    },
    [completeTransition, imageCount, isAnimating, selectedIndex],
  );

  useEffect(() => {
    warmGalleryImages(selectedIndex);
  }, [selectedIndex]);

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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, onClose]);

  useEffect(() => clearTransitionTimeout, [clearTransitionTimeout]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimating || event.pointerType !== "mouse") {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStartXRef.current = event.clientX;
    pointerStartTimeRef.current = performance.now();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "mouse" ||
      activePointerIdRef.current !== event.pointerId ||
      isAnimating
    ) {
      return;
    }

    updateDragOffset(event.clientX);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "mouse" ||
      activePointerIdRef.current !== event.pointerId ||
      isAnimating
    ) {
      return;
    }

    activePointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isAnimating || event.touches.length !== 1) {
      return;
    }

    isTouchDraggingRef.current = true;
    pointerStartXRef.current = event.touches[0].clientX;
    pointerStartTimeRef.current = performance.now();
    dragOffsetRef.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (
      !isTouchDraggingRef.current ||
      isAnimating ||
      event.touches.length !== 1
    ) {
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
    const boundedOffset = Math.max(
      -viewportWidth,
      Math.min(viewportWidth, nextOffset),
    );

    dragOffsetRef.current = boundedOffset;
    setDragOffset(boundedOffset);
  };

  const finishDrag = () => {
    const finalDragOffset = dragOffsetRef.current;
    const elapsedTime = Math.max(performance.now() - pointerStartTimeRef.current, 1);
    const velocity = finalDragOffset / elapsedTime;
    const viewportWidth = viewportRef.current?.clientWidth ?? 410;
    const shouldNavigate =
      Math.abs(finalDragOffset) > viewportWidth * 0.14 ||
      Math.abs(velocity) > 0.45;

    if (shouldNavigate && finalDragOffset !== 0) {
      navigate(finalDragOffset < 0 ? "next" : "previous");
      return;
    }

    setIsAnimating(true);
    const snapBackDuration = getSlideTransitionDuration(
      Math.abs(finalDragOffset),
      viewportWidth,
    );
    setTransitionDuration(snapBackDuration);
    dragOffsetRef.current = 0;
    setDragOffset(0);
    completeTransition(null, snapBackDuration);
  };

  const slides = [-1, 0, 1].map((offset) => {
    const index = getWrappedIndex(selectedIndex + offset, imageCount);

    return {
      image: weddingContent.gallery[index],
      index,
      offset,
      isCurrent: offset === 0,
    };
  });

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
        aria-label="웨딩 사진 상세보기"
      >
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-beige font-serif text-[11px] font-semibold text-brand-gold ring-1 ring-brand-gold/20">
              D&amp;J
            </span>
            <div>
              <p className="font-[Inter,ui-sans-serif,system-ui,sans-serif] text-xs font-semibold text-brand-ink">
                Donghee &amp; Jiyeon
              </p>
              <p className="mt-0.5 text-[10px] text-brand-muted">Wedding Gallery</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[11px] font-medium text-brand-muted">
              {selectedIndex + 1}/{weddingContent.gallery.length}
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
              {slides.map(({ image, index, offset, isCurrent }) => (
                <div
                  key={offset}
                  className="relative h-full w-full shrink-0 bg-brand-beige/70"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${weddingContent.gallery.length}`}
                >
                  <LightboxImage image={image} isCurrent={isCurrent} />
                </div>
              ))}
            </div>
          </div>

          <LightboxNavigationButton
            direction="previous"
            onClick={() => navigate("previous")}
          />
          <LightboxNavigationButton direction="next" onClick={() => navigate("next")} />
        </div>

        <footer className="flex h-14 shrink-0 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-brand-ink">우리의 소중한 순간들</p>
            <p className="mt-0.5 text-[10px] text-brand-muted">옆으로 밀어 다음 사진을 볼 수 있어요</p>
          </div>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-brand-beige">
            <motion.div
              className="h-full origin-left bg-brand-gold"
              animate={{
                scaleX: (selectedIndex + 1) / weddingContent.gallery.length,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
        </footer>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function LightboxImage({
  image,
  isCurrent,
}: {
  image: (typeof weddingContent.gallery)[number];
  isCurrent: boolean;
}) {
  const [isDecoded, setIsDecoded] = useState(() => decodedGalleryImages.has(image.src));

  useEffect(() => {
    let isMounted = true;

    void preloadGalleryImage(image.src).then(() => {
      if (isMounted) {
        setIsDecoded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [image.src]);

  return (
    <>
      <img
        src={image.thumbnailSrc}
        alt=""
        className={getLightboxImageClassName(image)}
        aria-hidden="true"
        draggable={false}
      />
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading="eager"
        decoding="async"
        fetchPriority={isCurrent ? "high" : "auto"}
        className={`${getLightboxImageClassName(image)} transition-opacity duration-100 ${
          isDecoded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
      />
    </>
  );
}

function getLightboxImageClassName(
  image: (typeof weddingContent.gallery)[number],
) {
  const isPortrait = image.height > image.width;

  return `pointer-events-none absolute inset-0 h-full w-full select-none ${
    isPortrait ? "object-cover" : "object-contain"
  }`;
}

function getWrappedIndex(index: number, imageCount: number) {
  return (index + imageCount) % imageCount;
}

function getSlideTransitionDuration(distance: number, viewportWidth: number) {
  const distanceRatio = Math.min(Math.max(distance / viewportWidth, 0), 1);

  return Math.round(
    MIN_SLIDE_TRANSITION_DURATION +
      (MAX_SLIDE_TRANSITION_DURATION - MIN_SLIDE_TRANSITION_DURATION) *
        distanceRatio,
  );
}

function warmGalleryImages(selectedIndex: number) {
  const imageCount = weddingContent.gallery.length;

  for (let offset = -2; offset <= 2; offset += 1) {
    const imageIndex = getWrappedIndex(selectedIndex + offset, imageCount);
    void preloadGalleryImage(weddingContent.gallery[imageIndex].src);
  }
}

function preloadGalleryImage(src: string) {
  const cachedPromise = galleryImagePromises.get(src);

  if (cachedPromise) {
    return cachedPromise;
  }

  const imagePromise = new Promise<void>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    image.fetchPriority = "high";
    image.src = src;

    const markDecoded = () => {
      decodedGalleryImages.add(src);
      resolve();
    };

    if (image.complete) {
      void image.decode().then(markDecoded, markDecoded);
      return;
    }

    image.onload = () => {
      void image.decode().then(markDecoded, markDecoded);
    };
    image.onerror = () => resolve();
  });

  galleryImagePromises.set(src, imagePromise);
  return imagePromise;
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
