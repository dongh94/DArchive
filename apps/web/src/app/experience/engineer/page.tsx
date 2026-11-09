import type { Metadata } from "next";
import { ExperienceWingPage } from "@/features/experience/experience-page";

export const metadata: Metadata = {
  title: "Engineer wing | Donghee Archive",
  description: "OpenStack 기반 고객 환경의 장애 분석과 복구, 클라우드 엔지니어로서의 기록",
};

export default function Page() {
  return <ExperienceWingPage wingId="engineer" />;
}
