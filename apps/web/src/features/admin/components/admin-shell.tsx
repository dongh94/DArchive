import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Boxes, Home, LogOut, Settings, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { logoutAdmin } from "../lib/actions";

const navigation = [
  { title: "Overview", href: "/admin", icon: Home },
  { title: "Wedding", href: "/admin/wedding", icon: Sparkles },
  { title: "Projects", href: "/admin/projects", icon: Boxes },
  { title: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminShell({
  activeHref,
  children,
  title,
  description,
}: {
  activeHref: string;
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold">DArchive Admin</span>
              <span className="block text-xs text-foreground/50">Operations console</span>
            </span>
          </Link>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-muted px-3 text-sm font-semibold text-foreground/70 transition hover:bg-border hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[220px_minmax(0,1fr)] md:px-8">
        <aside className="md:sticky md:top-8 md:self-start">
          <nav className="grid gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition hover:bg-muted hover:text-foreground",
                    isActive ? "bg-muted text-foreground shadow-sm" : "text-foreground/60",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#4285f4]">Admin</p>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/55 md:text-base">{description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
