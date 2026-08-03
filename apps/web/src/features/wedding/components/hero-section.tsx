"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera } from "lucide-react";
import { weddingContent } from "../data/wedding-content";

const initialIntroDurationMs = 2300;
const replayIntroDurationMs = 2200;
const shutterFlashDelaySeconds = 0.5;
const photoRevealDurationSeconds = 1.65;
const polaroidControlButtonClassName =
  "absolute top-4 z-[70] flex h-9 w-9 items-center justify-center rounded-full bg-white/88 text-brand-ink shadow-[0_8px_24px_rgba(44,44,44,0.14)] ring-1 ring-brand-gold/15 backdrop-blur";
const subscribeToHeroImage = () => () => undefined;
const initialClientHeroImageIndex =
  typeof window === "undefined"
    ? 0
    : getRandomImageIndex(weddingContent.hero.images.length);

export function HeroSection() {
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const initialHeroImageIndex = useSyncExternalStore(
    subscribeToHeroImage,
    () => initialClientHeroImageIndex,
    () => -1,
  );
  const [replayedHeroImageIndex, setReplayedHeroImageIndex] = useState<
    number | null
  >(null);
  const replayTimerRef = useRef<number | null>(null);
  const { event, hero, location } = weddingContent;
  const heroImageIndex = replayedHeroImageIndex ?? initialHeroImageIndex;
  const heroImage = hero.images[heroImageIndex];

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const shutterTimer = window.setTimeout(() => {
      playShutterClick();
    }, 160);

    const timer = window.setTimeout(() => {
      setIsIntroVisible(false);
      document.body.style.overflow = "unset";
    }, initialIntroDurationMs);

    return () => {
      document.body.style.overflow = "unset";
      window.clearTimeout(shutterTimer);
      window.clearTimeout(timer);
      if (replayTimerRef.current !== null) {
        window.clearTimeout(replayTimerRef.current);
      }
    };
  }, []);

  const handleCameraClick = () => {
    if (isIntroVisible) {
      return;
    }

    if (replayTimerRef.current !== null) {
      window.clearTimeout(replayTimerRef.current);
    }

    playShutterClick();
    setReplayedHeroImageIndex(
      getRandomImageIndex(hero.images.length, heroImageIndex),
    );
    setIsIntroVisible(true);

    replayTimerRef.current = window.setTimeout(() => {
      setIsIntroVisible(false);
      document.body.style.overflow = "unset";
      replayTimerRef.current = null;
    }, replayIntroDurationMs);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-brand-cream">
      <motion.div
        className="relative z-10 flex h-full w-full items-center justify-center px-7 py-10"
        initial={{ opacity: 0.92, scale: 0.98 }}
        animate={{
          opacity: 1,
          scale: isIntroVisible ? 0.98 : 1,
        }}
        transition={{ delay: isIntroVisible ? 0 : 0.05, duration: 1.05, ease: "easeOut" }}
      >
        <PolaroidCard
          dateLabel={event.heroDateLabel}
          imageAlt={hero.imageAlt}
          imageUrl={heroImage?.src}
          isIntroVisible={isIntroVisible}
          venue={location.heroVenue}
        />
      </motion.div>

      <CameraReplayButton onClick={handleCameraClick} isDisabled={isIntroVisible} />

      <AnimatePresence>
        {isIntroVisible ? <ScreenFlash /> : null}
      </AnimatePresence>
    </section>
  );
}

function PolaroidCard({
  dateLabel,
  imageAlt,
  imageUrl,
  isIntroVisible,
  venue,
}: {
  dateLabel: string;
  imageAlt: string;
  imageUrl: string;
  isIntroVisible: boolean;
  venue: string;
}) {
  return (
    <div className="relative w-full max-w-[365px] rounded-[10px] bg-white px-5 pb-6 pt-3 shadow-[0_4px_10px_rgba(44,44,44,0.16),0_24px_58px_rgba(44,44,44,0.28)] ring-1 ring-black/5">
      <div className="relative z-[90] flex h-12 items-center justify-center">
        <DrawnWeddingTitle isIntroVisible={isIntroVisible} />
      </div>

      <PolaroidPhoto imageAlt={imageAlt} imageUrl={imageUrl} isIntroVisible={isIntroVisible} />
      <PolaroidCaption dateLabel={dateLabel} isIntroVisible={isIntroVisible} venue={venue} />
    </div>
  );
}

function PolaroidPhoto({
  imageAlt,
  imageUrl,
  isIntroVisible,
}: {
  imageAlt: string;
  imageUrl?: string;
  isIntroVisible: boolean;
}) {
  return (
    <motion.div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-[4px] bg-brand-beige"
      initial={{ filter: "brightness(1.25) saturate(0.35) blur(2.5px)" }}
      animate={{
        filter: isIntroVisible
          ? "brightness(1.25) saturate(0.35) blur(2.5px)"
          : "brightness(1) saturate(1) blur(0px)",
      }}
      transition={{ delay: isIntroVisible ? 0 : 0.05, duration: 1.05, ease: "easeOut" }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          unoptimized
          className="object-cover object-center"
          sizes="325px"
        />
      ) : null}
      <AnimatePresence>{isIntroVisible ? <PhotoDevelopOverlay /> : null}</AnimatePresence>
    </motion.div>
  );
}

function PhotoDevelopOverlay() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 0.92, 0.35, 0.08, 0] }}
      exit={{ opacity: 0 }}
      transition={{
        delay: shutterFlashDelaySeconds,
        duration: photoRevealDurationSeconds,
        times: [0, 0.22, 0.5, 0.78, 1],
        ease: "easeOut",
      }}
      className="absolute inset-0 bg-white"
    />
  );
}

function PolaroidCaption({
  dateLabel,
  isIntroVisible,
  venue,
}: {
  dateLabel: string;
  isIntroVisible: boolean;
  venue: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isIntroVisible ? 0 : 1, y: isIntroVisible ? 8 : 0 }}
      transition={{ delay: isIntroVisible ? 0 : 0.12, duration: 0.65, ease: "easeOut" }}
      className="pt-4 text-center text-brand-ink"
    >
      <p className="font-wedding-batang whitespace-nowrap text-[clamp(30px,8.7vw,38px)] font-normal leading-none tracking-normal">
        Donghee &amp; Jiyeon
      </p>
      <p className="mt-3 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[11px] font-semibold tracking-[0.28em] text-brand-ink">
        {dateLabel}
      </p>
      <p className="mt-3 text-xs text-brand-ink">{venue}</p>
    </motion.div>
  );
}

function CameraReplayButton({ isDisabled, onClick }: { isDisabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`${polaroidControlButtonClassName} right-16 disabled:cursor-default disabled:opacity-45`}
      aria-label="찰칵 효과 다시 보기"
    >
      <Camera size={18} strokeWidth={1.8} />
    </button>
  );
}

function ScreenFlash() {
  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.65, 0] }}
        transition={{
          delay: shutterFlashDelaySeconds,
          duration: 0.34,
          times: [0, 0.18, 1],
          ease: "easeOut",
        }}
        className="absolute inset-0 bg-white"
      />
    </motion.div>
  );
}

function DrawnWeddingTitle({ isIntroVisible }: { isIntroVisible: boolean }) {
  return (
    <div className="relative z-[100] flex h-full w-full items-center justify-center overflow-visible" aria-label="Our Wedding Day">
      <motion.span
        className="font-rottersand relative z-[100] inline-block whitespace-nowrap px-2 pb-4 pt-2 text-[clamp(21px,6.3vw,25px)] leading-none text-brand-gold"
        initial={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }}
        animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
        transition={{ delay: isIntroVisible ? 0.55 : 0, duration: 1.55, ease: [0.45, 0, 0.15, 1] }}
      >
        Our Wedding Day
      </motion.span>
    </div>
  );
}

function playShutterClick() {
  const audio = new Audio("/audio/polaroid-shutter.mp3");
  audio.volume = 0.55;

  // Browsers may reject media playback before the first user interaction.
  void audio.play().catch(() => undefined);
}

function getRandomImageIndex(imageCount: number, excludedIndex?: number) {
  if (imageCount <= 1) {
    return 0;
  }

  const randomIndex = Math.floor(
    Math.random() * (excludedIndex === undefined ? imageCount : imageCount - 1),
  );

  if (excludedIndex === undefined || randomIndex < excludedIndex) {
    return randomIndex;
  }

  return randomIndex + 1;
}
