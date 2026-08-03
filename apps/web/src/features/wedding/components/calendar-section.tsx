"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { weddingContent } from "../data/wedding-content";
import { getWeddingCountdown, type WeddingCountdown } from "../utils/date";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const COUNTDOWN_UNITS = [
  { key: "days", label: "일" },
  { key: "hours", label: "시간" },
  { key: "minutes", label: "분" },
  { key: "seconds", label: "초" },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<WeddingCountdown, "days" | "hours" | "minutes" | "seconds">;
  label: string;
}>;

export function CalendarSection() {
  const { couple, event, location } = weddingContent;
  const [countdown, setCountdown] = useState<WeddingCountdown | null>(null);
  const weddingDate = new Date(event.dateTime);
  const weddingDay = weddingDate.getDate();
  const daysInMonth = new Date(
    weddingDate.getFullYear(),
    weddingDate.getMonth() + 1,
    0,
  ).getDate();
  const firstWeekday = new Date(
    weddingDate.getFullYear(),
    weddingDate.getMonth(),
    1,
  ).getDay();
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({
      id: `blank-${index}`,
      day: null,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      id: `day-${index + 1}`,
      day: index + 1,
    })),
  ];

  useEffect(() => {
    const updateCountdown = () => setCountdown(getWeddingCountdown());

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="bg-white px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-sm uppercase tracking-[0.4em] text-brand-gold">
          Date
        </h2>
        <p className="font-serif text-xl">{event.dateLabel}</p>
        <p className="mt-2 inline-block bg-brand-gold/15 px-2 py-1 text-sm text-brand-ink">
          {event.dayTimeLabel}
        </p>
        <p className="mt-3 text-sm text-brand-ink">{location.venue}</p>
      </div>

      <div className="mx-auto max-w-xs">
        <div className="mb-8 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold font-serif text-3xl leading-none text-white">
            <span className="-mt-2 block">9</span>
          </span>
        </div>
        <div className="grid grid-cols-7 gap-y-4 text-center text-sm">
          {WEEKDAYS.map((weekday, index) => (
            <div
              key={`${weekday}-${index}`}
              className={cn(
                "mx-auto flex h-6 w-6 items-center justify-center text-[10px] font-medium tracking-widest",
                index === 0 && "text-red-400",
                index !== 0 && "text-brand-muted",
              )}
            >
              {weekday}
            </div>
          ))}

          {calendarCells.map(({ id, day }, index) => {
            const isWeddingDay = day === weddingDay;

            if (day === null) {
              return <div key={id} aria-hidden="true" />;
            }

            return (
              <div key={id} className="relative py-2">
                <span
                  className={cn(
                    "relative z-10",
                    isWeddingDay
                      ? "font-bold text-white"
                      : index % 7 === 0
                        ? "text-red-400"
                        : "text-brand-ink",
                  )}
                >
                  {day}
                </span>
                {isWeddingDay ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    className="absolute inset-0 -z-0 m-auto h-8 w-8 rounded-full bg-brand-gold"
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-light text-brand-muted">
            {couple.groom.name}{" "}
            <Heart
              size={10}
              className="mx-1 inline fill-brand-gold text-brand-gold"
            />{" "}
            {countdown?.isAfterWedding
              ? `${couple.bride.name}, 부부가 된 지`
              : `${couple.bride.name}의 결혼식까지`}
          </p>
          <time
            dateTime={event.dateTime}
            className="mt-5 grid grid-cols-4 gap-2"
            aria-label={
              countdown
                ? `${countdown.days}일 ${countdown.hours}시간 ${countdown.minutes}분 ${countdown.seconds}초 ${
                    countdown.isAfterWedding ? "지남" : "남음"
                  }`
                : "결혼식 시간 계산 중"
            }
          >
            {COUNTDOWN_UNITS.map(({ key, label }) => (
              <span
                key={key}
                className="rounded-lg border border-brand-gold/10 bg-brand-beige/30 px-1 py-3"
              >
                <CountdownNumber value={countdown?.[key] ?? null} />
                <span className="mt-1 block text-[10px] tracking-[0.18em] text-brand-muted">
                  {label}
                </span>
              </span>
            ))}
          </time>
          {countdown?.isAfterWedding ? (
            <p className="mt-4 text-xs font-medium text-brand-gold">
              지났습니다.
            </p>
          ) : (
            <p className="mt-4 text-xs text-brand-muted">남았습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function CountdownNumber({ value }: { value: number | null }) {
  const shouldReduceMotion = useReducedMotion();
  const characters =
    value === null ? ["-", "-"] : String(value).padStart(2, "0").split("");

  return (
    <span
      className="flex h-7 items-center justify-center overflow-hidden text-xl font-semibold tabular-nums text-brand-ink"
      aria-hidden="true"
    >
      {characters.map((character, index) => (
        <span key={index} className="relative h-7 w-[0.62em] overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.span
              key={character}
              initial={shouldReduceMotion ? false : { y: "75%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={
                shouldReduceMotion ? { opacity: 0 } : { y: "-75%", opacity: 0 }
              }
              transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {character}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
