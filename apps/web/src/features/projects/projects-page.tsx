import Link from "next/link";
import { ArrowUpRight, BarChart3, BookOpenText, Boxes, Sparkles } from "lucide-react";
import { HomeNavbar } from "@/features/home/components/home-navbar";
import { plannedProjects, type PlannedProject } from "./data/projects-content";

const projectIcons = [BarChart3, BookOpenText, Boxes] as const;

export function ProjectsPage() {
  return (
    <div className="home-page min-h-screen bg-background text-foreground selection:bg-[#4285f4] selection:text-white">
      <HomeNavbar />
      <main>
        <section className="px-5 pb-28 pt-32 md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 max-w-5xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-[#34a853]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Projects</span>
              </div>
              <h1 className="mt-8 max-w-5xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
            앞으로 직접 만들어갈 앱과 실험들.
              </h1>
              <p className="mt-8 max-w-3xl text-lg font-light leading-relaxed text-foreground/60 md:text-xl">
            이곳은 완성된 포트폴리오보다 앞으로 개발할 프로젝트들의 진입점입니다. 주식 투자 도구, 개발 기록 시스템, 새로운 앱 실험을 순차적으로 확장할 예정입니다.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {plannedProjects.map((project, index) => (
                <ProjectCard key={project.title} project={project} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProjectCard({ index, project }: { index: number; project: PlannedProject }) {
  const Icon = projectIcons[index] ?? Boxes;

  return (
    <article className="home-card group flex min-h-[340px] flex-col justify-between p-7">
      <div>
        <div className="mb-8 flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#34a853]/10 text-[#34a853]">
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground/60">{project.status}</span>
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#34a853]">{project.category}</p>
        <h2 className="mb-4 font-display text-3xl font-bold tracking-tight">{project.title}</h2>
        <p className="m-0 leading-relaxed text-foreground/55">{project.description}</p>
      </div>

      <div className="mt-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground/50">
              {tag}
            </span>
          ))}
        </div>
        <Link href={project.href} className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold transition group-hover:bg-primary group-hover:text-primary-foreground">
          View plan
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
