import type { Metadata } from "next";
import { GuestPhotosPage } from "@/features/wedding/guest-photos-page";

const title = "Live Photos | Donghee & Jiyeon Wedding";
const description = "동희와 지연의 결혼식 순간을 함께 모아보세요.";
const imageUrl = "/images/wedding/gallery/full/gallery-11-b0233001d0.webp";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/wedding/photos",
  },
  openGraph: {
    title,
    description,
    url: "/wedding/photos",
    siteName: "Donghee & Jiyeon Wedding",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: imageUrl,
        width: 1536,
        height: 2048,
        alt: "Donghee and Jiyeon wedding live photos",
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

export default function WeddingPhotosRoute() {
  return <GuestPhotosPage />;
}
