import type { Metadata } from "next";
import { ProjectsPage } from "@/features/projects/projects-page";

export const metadata: Metadata = {
  title: "Projects | Donghee Archive",
  description: "앞으로 개발할 앱과 실험 프로젝트의 허브",
};

export default function Page() {
  return <ProjectsPage />;
}
