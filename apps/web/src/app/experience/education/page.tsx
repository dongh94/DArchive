import type { Metadata } from "next";
import { EducationExperiencePage } from "@/features/experience/experience-page";

export const metadata: Metadata = {
  title: "Education | Donghee Archive",
  description: "교육 과정과 프로젝트 기반 학습 기록",
};

export default function Page() {
  return <EducationExperiencePage />;
}
