import type { Metadata } from "next";
import { WeddingInvitation } from "@/features/wedding/wedding-invitation";

const title = "Donghee & Jiyeon Wedding";
const description = "2026. 09. 12 SAT PM 4:40, MJ 컨벤션 5층 그랜드볼룸에서 동희와 지연의 결혼식에 초대합니다.";
const imageUrl = "/images/wedding/gallery/full/gallery-11-b0233001d0.webp";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/wedding",
  },
  openGraph: {
    title,
    description,
    url: "/wedding",
    siteName: "Donghee & Jiyeon Wedding",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: imageUrl,
        width: 1536,
        height: 2048,
        alt: "Donghee and Jiyeon wedding invitation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [imageUrl],
  },
};

export default function WeddingPage() {
  return <WeddingInvitation />;
}
