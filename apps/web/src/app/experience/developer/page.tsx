import type { Metadata } from "next";
import { ExperienceWingPage } from "@/features/experience/experience-page";

export const metadata: Metadata = {
  title: "Developer wing | Donghee Archive",
  description: "교육 과정부터 클라우드 관리 플랫폼 콘솔과 공통 구조 개발까지, 프론트엔드 엔지니어로서의 기록",
};

export default function Page() {
  return <ExperienceWingPage wingId="developer" />;
}
