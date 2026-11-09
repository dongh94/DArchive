"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, ArrowRight, DoorOpen, Footprints, Trophy } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { exhibitKindLabels } from "../data/gallery-content";
import type { HallLayout, HallStop } from "../lib/hall-layout";
import { ExhibitDialog } from "./exhibit-dialog";
import { GalleryAvatar } from "./gallery-avatar";

const SPEED = 0.42;
const REACH = 120;
const STORAGE_PREFIX = "experience-visited:";

type Props = {
  accent: string;
  label: string;
  layout: HallLayout;
  storageKey: string;
};

const visitedListeners = new Set<() => void>();

function subscribeVisited(notify: () => void) {
  visitedListeners.add(notify);
  return () => {
    visitedListeners.delete(notify);
  };
}

function readVisitedRaw(key: string): string {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) ?? "[]";
  } catch {
    return "[]";
  }
}

function markVisited(key: string, id: string) {
  const current = new Set(JSON.parse(readVisitedRaw(key)) as string[]);
  if (current.has(id)) return;

  current.add(id);
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify([...current]));
  } catch {
    // Storage can be unavailable (private mode); progress simply isn't kept.
  }
  visitedListeners.forEach((notify) => notify());
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function GalleryHall({ accent, label, layout, storageKey }: Props) {
  const router = useRouter();
  const sceneRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(layout.start);
  const camRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const targetRef = useRef<{ x: number; stop?: HallStop } | null>(null);
  const activeRef = useRef<string | null>(null);
  const zoneRef = useRef<string>("");
  const openRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [zone, setZone] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const visitedRaw = useSyncExternalStore(
    subscribeVisited,
    () => readVisitedRaw(storageKey),
    () => "[]",
  );
  const visited = useMemo(() => new Set(JSON.parse(visitedRaw) as string[]), [visitedRaw]);

  const stopsById = new Map(layout.stops.map((stop) => [stop.id, stop]));
  const activeStop = activeId ? stopsById.get(activeId) : undefined;
  const openStop = openId ? stopsById.get(openId) : undefined;
  const visitedCount = layout.stops.filter((stop) => stop.type === "exhibit" && visited.has(stop.id)).length;

  useEffect(() => {
    openRef.current = openId !== null;
  }, [openId]);

  const closeDialog = useCallback(() => setOpenId(null), []);

  const activate = useCallback(
    (stop: HallStop) => {
      if (stop.type === "door") {
        router.push(stop.door.href);
        return;
      }

      setOpenId(stop.id);
    },
    [router],
  );

  const walkTo = useCallback(
    (x: number, stop?: HallStop) => {
      const clamped = Math.min(layout.width - 60, Math.max(60, x));

      if (reducedMotionRef.current) {
        posRef.current = clamped;
        targetRef.current = null;
        if (stop) activate(stop);
        return;
      }

      targetRef.current = { x: clamped, stop };
    },
    [activate, layout.width],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;
    const onChange = () => {
      reducedMotionRef.current = media.matches;
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min(48, now - last);
      last = now;

      const keys = keysRef.current;
      let direction = 0;

      if (!openRef.current) {
        if (keys.left) direction -= 1;
        if (keys.right) direction += 1;

        if (direction !== 0) {
          targetRef.current = null;
        } else if (targetRef.current) {
          const delta = targetRef.current.x - posRef.current;

          if (Math.abs(delta) <= SPEED * dt) {
            posRef.current = targetRef.current.x;
            const arrived = targetRef.current.stop;
            targetRef.current = null;
            if (arrived) activate(arrived);
          } else {
            direction = Math.sign(delta);
          }
        }
      }

      if (direction !== 0) {
        posRef.current = Math.min(layout.width - 60, Math.max(60, posRef.current + direction * SPEED * dt));
      }

      const scene = sceneRef.current;
      const world = worldRef.current;
      const avatar = avatarRef.current;

      if (scene && world && avatar) {
        const viewWidth = scene.clientWidth;
        const cam =
          layout.width <= viewWidth
            ? -(viewWidth - layout.width) / 2
            : Math.min(layout.width - viewWidth, Math.max(0, posRef.current - viewWidth / 2));

        camRef.current = cam;
        world.style.transform = `translate3d(${-cam}px, 0, 0)`;
        avatar.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
        avatar.dataset.walking = direction !== 0 ? "true" : "false";
        if (direction !== 0) avatar.dataset.facing = direction > 0 ? "right" : "left";
      }

      let nearest: HallStop | null = null;
      let nearestDistance = REACH;

      for (const stop of layout.stops) {
        const distance = Math.abs(stop.x - posRef.current);
        if (distance < nearestDistance) {
          nearest = stop;
          nearestDistance = distance;
        }
      }

      const nextActive = nearest?.id ?? null;
      if (nextActive !== activeRef.current) {
        activeRef.current = nextActive;
        setActiveId(nextActive);
        if (nearest?.type === "exhibit") markVisited(storageKey, nearest.id);
      }

      let currentZone = layout.stops[0]?.zone ?? "";
      for (const stop of layout.stops) {
        if (stop.x - REACH <= posRef.current) currentZone = stop.zone;
      }
      if (currentZone !== zoneRef.current) {
        zoneRef.current = currentZone;
        setZone(currentZone);
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activate, layout, storageKey]);

  useEffect(() => {
    function sceneInView() {
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect) return false;
      const middle = window.innerHeight / 2;
      return rect.top < middle && rect.bottom > middle * 0.6;
    }

    function setKey(event: KeyboardEvent, pressed: boolean) {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keysRef.current.left = pressed;
        return true;
      }
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        keysRef.current.right = pressed;
        return true;
      }
      return false;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (openRef.current || isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      const focusInScene = sceneRef.current?.contains(document.activeElement) ?? false;
      const focusOnPage = document.activeElement === document.body || focusInScene;

      if (!sceneInView() && !focusInScene) return;

      if (setKey(event, true)) {
        event.preventDefault();
        return;
      }

      if ((event.key === "Enter" || event.key === " " || event.key === "e" || event.key === "E") && focusOnPage) {
        const stop = activeRef.current ? layout.stops.find((item) => item.id === activeRef.current) : undefined;
        if (stop) {
          event.preventDefault();
          activate(stop);
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      setKey(event, false);
    }

    function onBlur() {
      keysRef.current.left = false;
      keysRef.current.right = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [activate, layout.stops]);

  function handleFloorPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    walkTo(event.clientX - rect.left + camRef.current);
  }

  function holdButton(direction: "left" | "right") {
    const release = () => {
      keysRef.current[direction] = false;
    };

    return {
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        keysRef.current[direction] = true;
      },
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
    };
  }

  return (
    <div className="experience-gallery" style={{ ["--hall-accent" as string]: accent }}>
      <div ref={sceneRef} className="gallery-scene" role="application" aria-label={`${label} 전시관. 좌우 방향키로 걷고 Enter로 작품을 봅니다.`}>
        <div ref={worldRef} className="gallery-world" style={{ width: layout.width }}>
          <div className="gallery-wall" onPointerDown={handleFloorPointer} />
          <div className="gallery-floor" onPointerDown={handleFloorPointer} />

          {layout.signs.map((sign) =>
            sign.variant === "intro" ? (
              <div key={sign.id} className="gallery-intro-plaque" style={{ left: sign.x }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hall-muted)]">Welcome</p>
                <p className="mt-2 text-lg font-bold leading-snug">{sign.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--hall-muted)]">{sign.caption}</p>
              </div>
            ) : (
              <div key={sign.id} className="gallery-zone-sign" style={{ left: sign.x }}>
                <p className="gallery-zone-title">{sign.title}</p>
                <p className="gallery-zone-caption">{sign.caption}</p>
              </div>
            ),
          )}

          {layout.stops.map((stop) => {
            const isActive = stop.id === activeId;

            if (stop.type === "door") {
              return (
                <button
                  key={stop.id}
                  type="button"
                  className="gallery-door"
                  data-active={isActive}
                  style={{ left: stop.x, ["--door-accent" as string]: stop.door.accent }}
                  onClick={() => walkTo(stop.x, stop)}
                  aria-label={`${stop.door.label}로 이동`}
                >
                  <span className="gallery-door-sign">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">{stop.door.label}</span>
                    <span className="block text-sm font-bold">{stop.door.title}</span>
                    <span className="block text-[11px] opacity-70">{stop.door.period}</span>
                  </span>
                  <span className="gallery-door-frame">
                    <DoorOpen className="h-6 w-6" aria-hidden="true" />
                  </span>
                </button>
              );
            }

            const { exhibit } = stop;
            const image = exhibit.images?.[0];

            return (
              <button
                key={stop.id}
                type="button"
                className="gallery-exhibit"
                data-active={isActive}
                data-visited={visited.has(stop.id)}
                style={{ left: stop.x }}
                onClick={() => walkTo(stop.x, stop)}
                aria-label={`${exhibit.title} 보기`}
              >
                <span className="gallery-spotlight" aria-hidden="true" />
                <span
                  className={cn(
                    "gallery-frame",
                    image ? (exhibit.imageLayout === "square" ? "gallery-frame-square" : "gallery-frame-portrait") : "gallery-frame-poster",
                  )}
                >
                  {image ? (
                    <Image src={image.src} alt="" fill sizes="200px" className="object-cover object-top" />
                  ) : (
                    <span className="gallery-poster">
                      {exhibit.kind === "trophy" ? <Trophy className="h-7 w-7" aria-hidden="true" /> : null}
                      <span className="gallery-poster-period">{exhibit.period}</span>
                      <span className="gallery-poster-title">{exhibit.title}</span>
                    </span>
                  )}
                  {exhibit.badge ? <span className="gallery-badge" title={exhibit.badge}>★</span> : null}
                </span>
                <span className="gallery-label">
                  <span className="gallery-kind-pill">{exhibitKindLabels[exhibit.kind]}</span>
                  <span className="mt-1 block truncate text-xs font-bold">{exhibit.title}</span>
                </span>
              </button>
            );
          })}

          <GalleryAvatar accent={accent} avatarRef={avatarRef} />
        </div>

        <div className="gallery-hud gallery-hud-top">
          <span className="gallery-hud-chip">
            <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
            {zone && zone !== label ? <span className="opacity-60">· {zone}</span> : null}
          </span>
          {layout.exhibitCount > 0 ? (
            <span className="gallery-hud-chip" aria-label={`전시물 ${layout.exhibitCount}개 중 ${visitedCount}개 관람`}>
              관람 {visitedCount}/{layout.exhibitCount}
              <span className="gallery-progress" aria-hidden="true">
                <span style={{ width: `${(visitedCount / layout.exhibitCount) * 100}%` }} />
              </span>
            </span>
          ) : null}
        </div>

        <div className="gallery-hud gallery-hud-bottom">
          <button type="button" className="gallery-move-button" aria-label="왼쪽으로 걷기" {...holdButton("left")}>
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="gallery-plaque" aria-live="polite">
            {activeStop ? (
              <>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-[var(--hall-muted)]">
                    {activeStop.type === "door"
                      ? activeStop.door.label
                      : `${exhibitKindLabels[activeStop.exhibit.kind]} · ${activeStop.exhibit.period}`}
                  </p>
                  <p className="truncate text-sm font-bold">{activeStop.type === "door" ? activeStop.door.title : activeStop.exhibit.title}</p>
                </div>
                <button type="button" className="gallery-plaque-action" onClick={() => activate(activeStop)}>
                  {activeStop.type === "door" ? "입장" : "자세히"}
                  <kbd className="hidden md:inline">Enter</kbd>
                </button>
              </>
            ) : (
              <p className="text-xs text-[var(--hall-muted)]">
                <span className="hidden md:inline">← → 또는 A D로 걷기 · 작품 앞에서 Enter · 바닥을 클릭해 이동</span>
                <span className="md:hidden">버튼을 누르거나 바닥을 탭해 걸어 보세요</span>
              </p>
            )}
          </div>

          <button type="button" className="gallery-move-button" aria-label="오른쪽으로 걷기" {...holdButton("right")}>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {openStop && openStop.type === "exhibit" ? (
        <ExhibitDialog accent={accent} exhibit={openStop.exhibit} onClose={closeDialog} />
      ) : null}
    </div>
  );
}
