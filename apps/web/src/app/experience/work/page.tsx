import type { Metadata } from "next";
import { WorkExperiencePage } from "@/features/experience/experience-page";

export const metadata: Metadata = {
  title: "Work Experience | Donghee Archive",
  description: "오케스트로 프론트엔드 개발 경험과 주요 업무 기록",
};

export default function Page() {
  return <WorkExperiencePage />;
}
