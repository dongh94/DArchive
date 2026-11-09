import type { Exhibit, GalleryDoor, GalleryWing } from "../data/gallery-content";
import { galleryWings, lobbyContent } from "../data/gallery-content";

export type HallStop =
  | { type: "exhibit"; id: string; x: number; zone: string; exhibit: Exhibit }
  | { type: "door"; id: string; x: number; zone: string; door: GalleryDoor };

export type HallSign = {
  id: string;
  x: number;
  title: string;
  caption: string;
  variant: "zone" | "intro";
};

export type HallLayout = {
  width: number;
  start: number;
  stops: HallStop[];
  signs: HallSign[];
  exhibitCount: number;
};

const EDGE = 220;
const STEP = 330;
const ZONE_GAP = 170;

const lobbyDoor: GalleryDoor = {
  id: "lobby",
  label: "Lobby",
  title: "로비로 돌아가기",
  period: "Experience",
  href: "/experience",
  accent: "#fbbc05",
};

export function layoutWing(wing: GalleryWing): HallLayout {
  const otherWing = galleryWings[wing.id === "developer" ? "engineer" : "developer"];
  const stops: HallStop[] = [];
  const signs: HallSign[] = [];
  let x = EDGE;

  stops.push({ type: "door", id: "door-lobby", x, zone: "Lobby", door: lobbyDoor });
  x += STEP;

  for (const zone of wing.zones) {
    signs.push({ id: `sign-${zone.id}`, x: x - STEP / 2 + ZONE_GAP / 4, title: zone.title, caption: zone.caption, variant: "zone" });
    x += ZONE_GAP / 2;

    for (const exhibit of zone.exhibits) {
      stops.push({ type: "exhibit", id: exhibit.id, x, zone: zone.title, exhibit });
      x += STEP;
    }

    x += ZONE_GAP / 2;
  }

  stops.push({
    type: "door",
    id: `door-${otherWing.id}`,
    x,
    zone: otherWing.label,
    door: {
      id: otherWing.id,
      label: otherWing.label,
      title: otherWing.title,
      period: otherWing.period,
      href: `/experience/${otherWing.id}`,
      accent: otherWing.accent,
    },
  });

  return {
    width: x + EDGE,
    start: EDGE + STEP / 2,
    stops,
    signs,
    exhibitCount: stops.filter((stop) => stop.type === "exhibit").length,
  };
}

export function layoutLobby(): HallLayout {
  const [developerDoor, engineerDoor] = lobbyContent.doors;
  const stops: HallStop[] = [
    { type: "door", id: "door-developer", x: EDGE, zone: "Lobby", door: developerDoor },
    { type: "exhibit", id: lobbyContent.trophies.id, x: EDGE + STEP * 2, zone: "Lobby", exhibit: lobbyContent.trophies },
    { type: "door", id: "door-engineer", x: EDGE + STEP * 3, zone: "Lobby", door: engineerDoor },
  ];

  return {
    width: EDGE * 2 + STEP * 3,
    start: EDGE + STEP,
    stops,
    signs: [
      {
        id: "sign-intro",
        x: EDGE + STEP,
        title: `${lobbyContent.name} · ${lobbyContent.role}`,
        caption: lobbyContent.intro,
        variant: "intro",
      },
    ],
    exhibitCount: 1,
  };
}
