import { weddingGallery } from "./wedding-gallery";

const heroSourceFileNames = [
  "a-11.JPG",
  "b-07.JPG",
  "c-08.JPG",
  "d-03.JPG",
  "e-04.JPG",
  "f-01.JPG",
] as const;

const heroImages = heroSourceFileNames.map((sourceFileName) => {
  const image = weddingGallery.find(
    (galleryImage) => galleryImage.sourceFileName === sourceFileName,
  );

  if (!image) {
    throw new Error(`Hero image not found: ${sourceFileName}`);
  }

  return image;
});

export const weddingContent = {
  couple: {
    groom: {
      role: "Groom",
      roleKo: "신랑",
      name: "김동희",
      facts: [
        { label: "담당", value: "길찾기와 계획 세우기" },
        { label: "특기", value: "조용히 챙겨주기" },
        { label: "취향", value: "커피, 산책, 기록" },
        { label: "지연 한정", value: "한없이 다정함" },
      ],
      imageUrl: "/images/wedding/groom-profile.webp",
      imageAlt: "김동희 프로필 사진",
    },
    bride: {
      role: "Bride",
      roleKo: "신부",
      name: "변지연",
      facts: [
        { label: "담당", value: "분위기 살리기" },
        { label: "특기", value: "웃게 만들기" },
        { label: "취향", value: "맛있는 것, 예쁜 것, 귀여운 것" },
        { label: "동희 한정", value: "제일 강한 편" },
      ],
      imageUrl: "/images/wedding/bride-profile.webp",
      imageAlt: "변지연 프로필 사진",
    },
  },
  event: {
    title: "김동희 & 변지연 결혼식",
    description: "김동희 & 변지연의 소중한 결혼식에 초대합니다.",
    dateTime: "2026-09-12T16:40:00+09:00",
    dateLabel: "2026. 09. 12",
    dayTimeLabel: "토요일 오후 4시 40분",
    heroDateLabel: "2026. 09. 12 SAT PM 4:40",
    calendarStart: "20260912T164000",
    calendarEnd: "20260912T184000",
  },
  location: {
    venue: "MJ 컨벤션 5층 그랜드볼룸",
    heroVenue: "MJ CONVENTION 5F GRAND BALLROOM",
    venueName: "MJ Convention",
    venueHall: "5층 그랜드볼룸",
    address: "경기도 부천시 소사구 소사본동 65-7(경인로 386)",
    phone: "032-347-5500",
    mapImageUrl: "https://picsum.photos/seed/map/600/600?grayscale",
    directions: [
      {
        title: "지하철 이용 시",
        lines: ["1호선, 서해선 > 소사역 1번출구 건너편 좌측(70m)"],
      },
      {
        title: "일반 버스 이용 시",
        lines: [
          "소사어울마당삼거리 · MJ 컨벤션 : 19, 83, 88, 88-1",
          "소사어울마당 삼거리 : 53, 60-1",
          "소사역 · 소사지구대 : 19, 53, 83, 88",
          "소사 푸르지오 : 56, 56-1, 60",
        ],
      },
      {
        title: "자가용 이용 시",
        lines: [
          "네비게이션 입력 - 부천시 소사구 소사본동 65-7번지",
          "서울외곽순환고속도로(시흥IC) - 소사본3동 - 소사구청 옆",
        ],
      },
      {
        title: "주차",
        lines: [
          "웨딩홀 주차타워 및 맞은편 주차장 이용 (2시간 무료)",
          "최대 800대 수용",
        ],
      },
    ],
  },
  gallery: weddingGallery,
  giftAccountGroups: [
    {
      side: "신랑 측",
      accounts: [
        {
          relation: "신랑",
          name: "김동희",
          bank: "카카오뱅크",
          account: "3333034454127",
          kakaoPayUrl: "https://qr.kakaopay.com/FQSPFiqac",
        },
        {
          relation: "신랑 아버지",
          name: "김세철",
          bank: "KB국민은행",
          account: "729202-96-115192",
        },
        {
          relation: "신랑 어머니",
          name: "김민주",
          bank: "KB국민은행",
          account: "729202-01-037229",
        },
      ],
    },
    {
      side: "신부 측",
      accounts: [
        {
          relation: "신부",
          name: "변지연",
          bank: "카카오뱅크",
          account: "3333012012534",
          kakaoPayUrl: "https://qr.kakaopay.com/Ej9HFmeid",
        },
        {
          relation: "신부 아버지",
          name: "황종규",
          bank: "하나은행",
          account: "488-910282-08207",
        },
        {
          relation: "신부 어머니",
          name: "강민경",
          bank: "KB국민은행",
          account: "66040201436738",
        },
      ],
    },
  ],
  share: {
    title: "김동희 & 변지연 결혼식",
    text: "2026년 9월 12일, 저희의 결혼식에 초대합니다.",
  },
  hero: {
    images: heroImages,
    imageAlt: "김동희 변지연 웨딩 사진",
  },
} as const;
