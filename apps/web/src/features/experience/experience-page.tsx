import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Building2, CheckCircle2, Cloud, GraduationCap, Network, PanelsTopLeft } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { HomeNavbar } from "@/features/home/components/home-navbar";
import {
  educationItems,
  projectGroups,
  projectSkills,
  skillCards,
  type ProjectItem,
} from "@/features/projects/data/projects-content";
import {
  coreCompetencies,
  experienceContent,
  experienceProjects,
  type ExperienceProject,
} from "./data/experience-content";

const focusMetrics = [
  { label: "Company", value: experienceContent.company, icon: Building2 },
  { label: "Role", value: experienceContent.role, icon: Briefcase },
  { label: "Domain", value: "Cloud Platform", icon: Cloud },
  { label: "Focus", value: "Console & Architecture", icon: PanelsTopLeft },
] as const;

export function ExperiencePage() {
  return (
    <div className="home-page min-h-screen bg-background text-foreground selection:bg-[#4285f4] selection:text-white">
      <HomeNavbar />
      <main>
        <HeroSection />
      </main>
    </div>
  );
}

export function WorkExperiencePage() {
  return (
    <main className="experience-page min-h-screen overflow-x-hidden bg-[#fffdf3] text-[#1f1b10]">
      <DetailHeader eyebrow="Work Experience" title="업무 경력" description="오케스트로에서 수행한 클라우드 콘솔, 디자인 시스템, 아키텍처 개선 업무를 정리했습니다." />
      <ProjectsTimeline />
      <CompetencySection />
    </main>
  );
}

export function EducationExperiencePage() {
  return (
    <main className="experience-page min-h-screen overflow-x-hidden bg-[#fffdf3] text-[#1f1b10]">
      <DetailHeader eyebrow="Education" title="교육/프로젝트" description="교육 과정과 프로젝트 기반 학습 기록을 정리했습니다." />
      <EducationArchiveSection />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="px-5 pb-28 pt-32 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1">
            <Briefcase className="h-3.5 w-3.5 text-[#fbbc05]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Experience</span>
          </div>
            <h1 className="mt-8 max-w-5xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
              <span className="block sm:hidden">
                <span className="block">업무와 교육을 통한</span>
                <span className="block">프로젝트들.</span>
              </span>
              <span className="hidden sm:inline">업무와 교육을 통한 프로젝트들.</span>
            </h1>
          <p className="mt-8 max-w-3xl break-words text-lg font-light leading-relaxed text-foreground/60 md:text-xl">Work와 Education으로 나누어 정리한 경험 기록입니다.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/experience/work" className="home-card group p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <span className="rounded-lg bg-[#fbbc05]/15 p-3">
                <Briefcase className="h-6 w-6 text-[#fbbc05]" />
              </span>
              <ArrowRight className="h-5 w-5 text-foreground/40 transition group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#fbbc05]">Work Experience</p>
            <h2 className="font-display text-2xl font-bold tracking-tight">업무 경력 보기</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/55">오케스트로에서 수행한 클라우드 콘솔, 디자인 시스템, 아키텍처 개선 업무를 정리했습니다.</p>
          </Link>
          <Link href="/experience/education" className="home-card group p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <span className="rounded-lg bg-[#fbbc05]/15 p-3">
                <GraduationCap className="h-6 w-6 text-[#fbbc05]" />
              </span>
              <ArrowRight className="h-5 w-5 text-foreground/40 transition group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#fbbc05]">Education</p>
            <h2 className="font-display text-2xl font-bold tracking-tight">교육/프로젝트 보기</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/55">기존 Projects 페이지에 있던 교육 과정 프로젝트와 학습 기록을 이 영역으로 옮겼습니다.</p>
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {focusMetrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.label} className="border-l border-border py-3 pl-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#fbbc05]" />
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground/35">{metric.label}</p>
                </div>
                <p className="text-base font-semibold text-foreground/75">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DetailHeader({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="px-5 pb-12 pt-10 md:px-12 md:pt-14">
      <div className="mx-auto max-w-7xl">
        <Link href="/experience" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-[#62512a] transition-colors hover:text-[#1f1b10]">
          <ArrowLeft className="h-4 w-4" />
          Experience
        </Link>
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#b58100]">{eyebrow}</p>
        <h1 className="max-w-5xl text-5xl font-black leading-tight tracking-tight md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#62512a]">{description}</p>
      </div>
    </section>
  );
}

function ProjectsTimeline() {
  return (
    <section id="work" className="border-y border-[#eadba8] bg-white px-5 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#b58100]">Major Projects</p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">주요 프로젝트</h2>
          <p className="mt-4 text-lg leading-8 text-[#62512a]">
            최근 아키텍처 개선과 디자인 시스템 업무부터 클라우드 자원 관리 콘솔, 레거시 마이그레이션까지 시간순으로 정리했습니다.
          </p>
        </div>

        <div className="grid gap-6">
          {experienceProjects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: ExperienceProject }) {
  return (
    <article className="grid min-w-0 gap-0 overflow-hidden rounded-lg border border-[#eadba8] bg-[#fff9df] lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="border-b border-[#eadba8] bg-[#3a2d08] p-6 text-white lg:border-b-0 lg:border-r">
        <div className="mb-8 grid gap-4 sm:flex sm:items-center sm:justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#fbbc05] text-sm font-black text-[#1f1b10]">{project.number}</span>
          <span className="max-w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/80">{project.period}</span>
        </div>
        <h3 className="break-words text-2xl font-black leading-tight [overflow-wrap:anywhere]">{project.title}</h3>
      </div>

      <div className="grid min-w-0 gap-7 p-6 md:p-8">
        <InfoBlock title="프로젝트 개요" body={project.overview} />
        <InfoBlock title="담당 역할" body={project.role} />

        <div>
          <h4 className="mb-3 text-sm font-black uppercase tracking-widest text-[#7a682f]">사용 기술</h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <span key={technology} className="rounded-lg border border-[#eadba8] bg-white px-3 py-2 text-xs font-bold text-[#4b3f1d]">
                {technology}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-[#7a682f]">주요 수행 업무 및 성과</h4>
          <ul className="grid gap-3">
            {project.achievements.map((achievement) => (
              <li key={achievement} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 text-sm leading-6 text-[#4b3f1d] md:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#b58100]" />
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-black uppercase tracking-widest text-[#7a682f]">{title}</h4>
      <p className="m-0 text-base leading-7 text-[#4b3f1d]">{body}</p>
    </div>
  );
}

function EducationArchiveSection() {
  return (
    <section id="education" className="border-b border-[#eadba8] bg-[#fff5cc] px-5 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-lg bg-white p-3 text-[#b58100] shadow-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#b58100]">Education</p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              <span className="block">교육 과정과</span>
              <span className="block">프로젝트 기록</span>
            </h2>
          </div>
          <p className="m-0 max-w-3xl text-lg leading-8 text-[#62512a]">
            기존 Projects 페이지에 있던 프로젝트 중심 포트폴리오를 이곳으로 옮겼습니다. 업무 경력과 분리해 교육 과정, 팀 프로젝트, 학습 기반 결과물을 확인할 수 있습니다.
          </p>
        </div>

        <div className="mb-10 grid auto-cols-[minmax(120px,1fr)] grid-flow-col overflow-x-auto rounded-lg border border-[#eadba8] bg-white">
          {projectSkills.map((skill) => (
            <p key={skill} className="m-0 grid min-h-16 place-items-center border-r border-[#eadba8] px-4 text-sm font-black text-[#7a682f] last:border-r-0">
              {skill}
            </p>
          ))}
        </div>

        <div className="grid gap-8">
          {projectGroups.map((group) => (
            <section key={group.title} className="grid gap-4">
              <div className="grid max-w-5xl grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#3a2d08] text-sm font-black text-white">{group.number}</span>
                <div>
                  <h3 className="mb-2 text-3xl font-black">{group.title}</h3>
                  <p className="m-0 leading-relaxed text-[#62512a]">{group.description}</p>
                </div>
              </div>
              <div className="grid gap-4">
                {group.projects.map((project) => (
                  <EducationProjectCard key={project.title} project={project} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-lg border border-[#eadba8] bg-white">
          {educationItems.map((education) => (
            <article key={education.title} className="grid gap-5 border-b border-[#eadba8] p-5 last:border-b-0 lg:grid-cols-[48px_minmax(0,1fr)] lg:items-center">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#fbbc05] text-sm font-black text-[#1f1b10]">{education.index}</div>
              <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.9fr)_minmax(320px,1.15fr)_minmax(260px,1fr)] lg:items-center">
                <div>
                  <p className="mb-1 text-xs font-black uppercase text-[#b58100]">{education.type}</p>
                  <div className="flex flex-wrap items-start gap-3">
                    <h3 className="m-0 text-xl font-black md:text-2xl">{education.title}</h3>
                    <span className="rounded-lg bg-[#fbbc05]/15 px-3 py-1.5 text-xs font-black text-[#7a682f]">{education.status}</span>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {education.meta.map(([label, value]) => (
                    <p key={label} className="m-0 rounded-lg bg-[#fff9df] p-3 text-sm font-black">
                      <span className="mb-1 block text-[11px] font-black text-[#9b8756]">{label}</span>
                      {value}
                    </p>
                  ))}
                </div>
                <p className="m-0 text-sm leading-relaxed text-[#62512a]">{education.summary}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {skillCards.map((skill) => (
            <article key={skill.title} className="rounded-lg border border-[#eadba8] bg-white p-5">
              <h3 className="mb-3 text-xl font-black">{skill.title}</h3>
              <p className="m-0 text-sm leading-6 text-[#62512a]">{skill.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function EducationProjectCard({ project }: { project: ProjectItem }) {
  return (
    <article className="rounded-lg border border-[#eadba8] bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#3a2d08] text-sm font-black text-white">{project.number}</span>
        <span className="rounded-lg bg-[#fbbc05]/15 px-3 py-2 text-xs font-black text-[#7a682f]">{project.context}</span>
      </div>
      <p className="mb-2 text-sm font-black uppercase tracking-widest text-[#b58100]">{project.kicker}</p>
      <h3 className="mb-3 text-3xl font-black">{project.title}</h3>
      <p className="m-0 max-w-4xl leading-relaxed text-[#62512a]">{project.description}</p>
      {project.highlights ? (
        <ul className="my-5 grid gap-2 pl-0 text-[#4b3f1d]">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="relative list-none pl-5 text-sm leading-6 before:absolute before:left-0 before:top-2.5 before:h-2 before:w-2 before:rounded-full before:bg-[#fbbc05]">
              {highlight}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="rounded-lg border border-[#eadba8] bg-[#fff9df] px-3 py-2 text-xs font-bold text-[#4b3f1d]">
            {tag}
          </span>
        ))}
      </div>
      <EducationScreenshotStrip project={project} />
    </article>
  );
}

function EducationScreenshotStrip({ project }: { project: ProjectItem }) {
  return (
    <div
      className={cn(
        "mt-7 grid gap-3 max-lg:flex max-lg:overflow-x-auto max-lg:pb-2",
        project.screenshotLayout === "square" ? "grid-cols-3" : "grid-cols-4",
      )}
      aria-label={`${project.title} 실제 실행 화면`}
    >
      {project.screenshots.map((screenshot) => (
        <figure
          key={screenshot.src}
          className={cn(
            "m-0 overflow-hidden rounded-lg border border-[#eadba8] bg-[#fff9df] max-lg:w-[min(72vw,230px)] max-lg:shrink-0",
            project.screenshotLayout === "square" ? "relative aspect-square" : "",
          )}
        >
          <Image
            src={screenshot.src}
            alt={screenshot.alt}
            width={420}
            height={project.screenshotLayout === "square" ? 420 : 650}
            className={cn("w-full object-cover object-top", project.screenshotLayout === "square" ? "h-full aspect-square" : "aspect-[9/14]")}
          />
          <figcaption
            className={cn(
              "text-center text-xs font-black text-[#1f1b10]",
              project.screenshotLayout === "square"
                ? "absolute bottom-2 left-2 right-2 rounded-lg bg-white/85 px-2 py-2"
                : "px-2 py-3",
            )}
          >
            {screenshot.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function CompetencySection() {
  return (
    <section className="px-5 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            <div className="mb-5 inline-flex rounded-lg bg-[#fff0b3] p-3 text-[#b58100]">
              <Network className="h-6 w-6" />
            </div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#b58100]">Core Competencies</p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">핵심 역량 요약</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {coreCompetencies.map((competency, index) => (
              <div
                key={competency}
                className={cn(
                  "rounded-lg border border-[#eadba8] bg-white p-5 text-sm font-semibold leading-6 text-[#4b3f1d] shadow-sm",
                  index === 0 || index === 1 ? "md:col-span-2" : "",
                )}
              >
                {competency}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
