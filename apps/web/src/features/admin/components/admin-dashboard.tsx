import Link from "next/link";
import { ArrowRight, Boxes, Sparkles } from "lucide-react";

const adminAreas = [
  {
    title: "Wedding",
    description: "RSVP, guestbook, and event response metrics.",
    href: "/admin/wedding",
    icon: Sparkles,
    accent: "text-[#ea4335]",
  },
  {
    title: "Projects",
    description: "Project metadata and future app operations.",
    href: "/admin/projects",
    icon: Boxes,
    accent: "text-[#34a853]",
  },
] as const;

export function AdminDashboard() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {adminAreas.map((area) => {
        const Icon = area.icon;

        return (
          <Link key={area.href} href={area.href} className="group rounded-lg border border-border bg-card p-6 shadow-sm transition hover:border-foreground/20">
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                <Icon className={`h-5 w-5 ${area.accent}`} />
              </span>
              <ArrowRight className="h-5 w-5 text-foreground/30 transition group-hover:text-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">{area.title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/55">{area.description}</p>
          </Link>
        );
      })}
    </section>
  );
}
