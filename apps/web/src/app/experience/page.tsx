import type { Metadata } from "next";
import { ExperiencePage } from "@/features/experience/experience-page";

export const metadata: Metadata = {
  title: "Experience | Donghee Archive",
  description: "업무 경력과 교육 기반 프로젝트 기록으로 이동하는 경험 허브",
};

export default function Page() {
  return <ExperiencePage />;
}
