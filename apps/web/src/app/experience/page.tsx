import type { Metadata } from "next";
import { ExperienceLobbyPage } from "@/features/experience/experience-page";

export const metadata: Metadata = {
  title: "Experience | Donghee Archive",
  description: "캐릭터를 움직여 개발자와 엔지니어로서의 경험을 둘러보는 전시관",
};

export default function Page() {
  return <ExperienceLobbyPage />;
}
