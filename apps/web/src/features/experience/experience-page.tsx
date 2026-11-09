import Link from "next/link";
import { List } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { HomeNavbar } from "@/features/home/components/home-navbar";
import { ExhibitList } from "./components/exhibit-list";
import { GalleryHall } from "./components/gallery-hall";
import { galleryWings, lobbyContent, type WingId } from "./data/gallery-content";
import { layoutLobby, layoutWing } from "./lib/hall-layout";

const wingTabs = [
  { id: "lobby", label: "Lobby", href: "/experience" },
  { id: "developer", label: "Developer", href: "/experience/developer" },
  { id: "engineer", label: "Engineer", href: "/experience/engineer" },
] as const;

function ExperienceBar({ current, title, period }: { current: (typeof wingTabs)[number]["id"]; title: string; period: string }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-20 md:px-12">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">Experience</p>
        <h1 className="mt-1 truncate text-lg font-bold md:text-xl">
          {title}
          <span className="ml-2 text-sm font-medium text-foreground/45">{period}</span>
        </h1>
      </div>
      <nav className="flex items-center gap-1.5" aria-label="전시관 이동">
        {wingTabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.id === current ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab.id === current ? "bg-foreground text-background" : "text-foreground/60 hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
        {current !== "lobby" ? (
          <a href="#exhibit-list" className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-foreground/60 hover:bg-muted hover:text-foreground">
            <List className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">목록</span>
          </a>
        ) : null}
      </nav>
    </div>
  );
}

export function ExperienceLobbyPage() {
  return (
    <div className="home-page min-h-screen bg-background text-foreground">
      <HomeNavbar />
      <main>
        <ExperienceBar current="lobby" title="경험 전시관" period={lobbyContent.role} />
        <GalleryHall accent="#fbbc05" label="Lobby" layout={layoutLobby()} storageKey="lobby" />
        <p className="mx-auto max-w-7xl px-5 py-6 text-sm text-foreground/55 md:px-12">
          왼쪽 문은 프론트엔드 개발자로 일한 Developer wing, 오른쪽 문은 클라우드 엔지니어로 일하는 Engineer wing으로 이어집니다.
        </p>
      </main>
    </div>
  );
}

export function ExperienceWingPage({ wingId }: { wingId: WingId }) {
  const wing = galleryWings[wingId];

  return (
    <div className="home-page min-h-screen bg-background text-foreground" style={{ ["--list-accent" as string]: wing.accent }}>
      <HomeNavbar />
      <main>
        <ExperienceBar current={wing.id} title={wing.title} period={wing.period} />
        <GalleryHall accent={wing.accent} label={wing.label} layout={layoutWing(wing)} storageKey={wing.id} />
        <p className="mx-auto max-w-7xl px-5 pt-6 text-sm text-foreground/55 md:px-12">{wing.intro}</p>
        <ExhibitList zones={wing.zones} />
      </main>
    </div>
  );
}
