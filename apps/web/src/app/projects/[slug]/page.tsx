import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { plannedProjects } from "@/features/projects/data/projects-content";

export function generateStaticParams() {
  return plannedProjects.map((project) => ({
    slug: project.href.split("/").at(-1) ?? "",
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = plannedProjects.find((item) => item.href.endsWith(`/${slug}`));

  return {
    title: project ? `${project.title} | Projects` : "Project | DArchive",
    description: project?.description,
  };
}

export default async function PlannedProjectRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = plannedProjects.find((item) => item.href.endsWith(`/${slug}`));

  if (!project) {
    notFound();
  }

  return (
    <main className="projects-page min-h-screen bg-[#f4fbf6] text-[#122016]">
      <section className="projects-section-band">
        <Link href="/projects" className="mb-10 inline-flex items-center gap-2 text-sm font-black text-[#66717f] transition-colors hover:text-[#122016]">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <div className="max-w-4xl rounded-lg border border-black/10 bg-white p-8 shadow-[0_20px_55px_rgba(18,23,31,0.08)] md:p-12">
          <p className="projects-eyebrow text-[#0f6f3d]">{project.category}</p>
          <h1 className="projects-balanced-title mb-5 text-5xl font-black leading-tight md:text-7xl">{project.title}</h1>
          <p className="mb-8 text-lg leading-relaxed text-[#66717f]">{project.description}</p>
          <span className="inline-flex rounded-lg bg-[#34a853]/10 px-4 py-3 text-sm font-black text-[#0f6f3d]">{project.status}</span>
        </div>
      </section>
    </main>
  );
}
