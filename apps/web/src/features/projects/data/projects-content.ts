export type ProjectTone = "dark" | "light" | "accent";

export type ProjectScreenshot = {
  src: string;
  alt: string;
  caption: string;
};

export type ProjectItem = {
  number: string;
  kicker: string;
  title: string;
  context: string;
  description: string;
  highlights?: string[];
  tags: string[];
  tone: ProjectTone;
  screenshots: ProjectScreenshot[];
  screenshotLayout: "phone" | "square";
};

export type ProjectGroup = {
  number: string;
  title: string;
  description: string;
  projects: ProjectItem[];
};

export type PlannedProject = {
  title: string;
  category: string;
  description: string;
  href: string;
  status: string;
  tags: string[];
};

type ContactLink = {
  label: string;
  href: string;
  external?: boolean;
};

export const projectsHero = {
  eyebrow: "Frontend Developer · Seoul",
  title: "복잡한 흐름을 사용자가 이해하는 화면으로 만듭니다.",
  description:
    "React, TypeScript, Next.js, Vue 기반의 서비스 프로젝트를 통해 인증, 폼, 데이터 시각화, 실시간 녹음, FSD 아키텍처까지 직접 설계하고 구현했습니다.",
  contact: {
    name: "김동희",
    description: "화면의 상태, API 흐름, 사용자의 다음 행동을 함께 고려하며 구현하는 프론트엔드 개발자입니다.",
    links: [
      { label: "dongh94@naver.com", href: "mailto:dongh94@naver.com" },
      { label: "GitHub", href: "https://github.com/dongh94", external: true },
    ] satisfies ContactLink[],
    location: "서울시 영등포구",
  },
} as const;

export const plannedProjects: PlannedProject[] = [
  {
    title: "Stock Lab",
    category: "Investment",
    description: "증권 API를 활용해 관심 종목, 포트폴리오, 투자 기록을 실험하는 주식 투자 프로젝트입니다.",
    href: "/projects/stock",
    status: "개발 예정",
    tags: ["Stock API", "Portfolio", "Analytics"],
  },
  {
    title: "DevLogs",
    category: "Writing",
    description: "Notion 또는 블로그 형태로 개발 기록, 회고, 아키텍처 실험을 정리하는 기록형 프로젝트입니다.",
    href: "/projects/devlogs",
    status: "개발 예정",
    tags: ["Notion", "Blog", "Knowledge Base"],
  },
  {
    title: "Coming Soon",
    category: "App Lab",
    description: "새로운 아이디어를 검증하고 작은 앱으로 만들어볼 예정인 실험 공간입니다.",
    href: "/projects/coming-soon",
    status: "개발 예정",
    tags: ["Prototype", "Experiment", "TBD"],
  },
];

export const projectSkills = ["React", "TypeScript", "Next.js", "Vite", "FSD", "React Query", "Vue", "Web Audio API"];

export const projectContexts = [
  {
    label: "Recent",
    title: "사내 개발 프로젝트",
    description: "MODAK, 한끼오케",
  },
  {
    label: "Education",
    title: "핀테크 인턴십 코스",
    description: "Moang",
  },
  {
    label: "Education",
    title: "삼성 청년 SW 아카데미",
    description: "Dadok, Ssafari Campus",
  },
] as const;

export const projectGroups: ProjectGroup[] = [
  {
    number: "01",
    title: "사내 개발 프로젝트",
    description: "업무 환경에서 구조, 유지보수성, 사용자 플로우를 고려해 만든 프로젝트입니다.",
    projects: [
      {
        number: "01",
        kicker: "AI 회의록 자동 생성기",
        title: "MODAK",
        context: "사내 개발 프로젝트",
        description:
          "실시간 녹음, 템플릿 선택, 회의록 생성/검색/편집까지 이어지는 업무형 서비스를 React 19와 TypeScript 기반으로 구현했습니다.",
        highlights: [
          "Web Audio API 기반 녹음 상태와 오디오 시각화 UI",
          "FSD 구조로 page, widget, feature, entity 역할 분리",
          "회의록 상세 편집, 템플릿 선택, API 연동 흐름 설계",
        ],
        tags: ["React 19", "TypeScript", "Vite", "Tailwind", "FSD"],
        tone: "dark",
        screenshotLayout: "phone",
        screenshots: [
          { src: "/images/projects/screenshots/modak-record.png", alt: "MODAK 회의 녹음 화면", caption: "Recording" },
          { src: "/images/projects/screenshots/modak-templates.png", alt: "MODAK 템플릿 관리 화면", caption: "Templates" },
          { src: "/images/projects/screenshots/modak-confluence.png", alt: "MODAK Confluence 업로드 화면", caption: "Confluence" },
          { src: "/images/projects/screenshots/modak-game-active.png", alt: "MODAK 딸기 게임 실행 화면", caption: "Game" },
        ],
      },
      {
        number: "02",
        kicker: "사내 점심 모임 모집 서비스",
        title: "한끼오케",
        context: "사내 개발 프로젝트",
        description:
          "회사 구성원들이 함께 점심을 먹을 인원을 모집하고, 식당 위치를 카카오맵으로 확인할 수 있는 사내 점심 매칭 앱입니다.",
        highlights: [
          "점심 방 리스트, 방 생성, 상세, 참여 흐름 구현",
          "카카오맵 연동으로 음식점 위치와 상세 장소 정보 제공",
          "FSD 구조로 페이지, 위젯, 기능, 엔티티 계층 정리",
        ],
        tags: ["React 18", "TypeScript", "React Query", "Recoil", "Vitest"],
        tone: "light",
        screenshotLayout: "phone",
        screenshots: [
          { src: "/images/projects/screenshots/hankki-login.png", alt: "한끼오케 로그인 실제 실행 화면", caption: "Login" },
          { src: "/images/projects/screenshots/hankki-main.png", alt: "한끼오케 점심 방 리스트 실제 실행 화면", caption: "Main" },
          { src: "/images/projects/screenshots/hankki-create.png", alt: "한끼오케 점심 방 만들기 실제 실행 화면", caption: "Create" },
          { src: "/images/projects/screenshots/hankki-detail.png", alt: "한끼오케 방 상세 실제 실행 화면", caption: "Detail" },
        ],
      },
    ],
  },
  {
    number: "02",
    title: "교육 프로그램 프로젝트",
    description: "핀테크 인턴십 코스와 삼성 청년 SW 아카데미에서 학습하며 구현한 프로젝트 경험입니다.",
    projects: [
      {
        number: "03",
        kicker: "커플 공동 지출 관리 웹/앱",
        title: "Moang",
        context: "핀테크 인턴십 코스 교육 프로젝트",
        description:
          "커플이 데이트 지출을 함께 기록하고 캘린더, 가계부, 목표 관리로 소비 흐름을 확인하는 모바일 금융 서비스입니다.",
        highlights: [
          "Next.js App Router 기반 PWA 모바일 화면 흐름 구성",
          "데이트 일정, 지출 내역, 목표 관리 상태를 연결한 UX 구현",
          "MUI와 Recharts 기반 지출 현황 및 목표 달성 시각화",
        ],
        tags: ["Next.js", "React", "PWA", "MUI", "Charts"],
        tone: "accent",
        screenshotLayout: "phone",
        screenshots: [
          { src: "/images/projects/screenshots/moang-home.png", alt: "Moang 홈 실제 실행 화면", caption: "Home" },
          { src: "/images/projects/screenshots/moang-calendar.png", alt: "Moang 캘린더 실제 실행 화면", caption: "Calendar" },
          { src: "/images/projects/screenshots/moang-account.png", alt: "Moang 가계부 실제 실행 화면", caption: "Account" },
          { src: "/images/projects/screenshots/moang-manage-goal.png", alt: "Moang 지출 관리 목표 실제 실행 화면", caption: "Goal" },
        ],
      },
      {
        number: "04",
        kicker: "독서 모임 기반 WebRTC 서비스",
        title: "Dadok",
        context: "삼성 청년 SW 아카데미",
        description:
          "Vue, Vuex, OpenVidu, Matter.js를 활용한 독서 모임 서비스. WebRTC 기반 화상 모임과 책이 떨어지는 인터랙션을 구현했습니다.",
        tags: ["Vue", "Vuex", "Matter.js", "OpenVidu"],
        tone: "light",
        screenshotLayout: "square",
        screenshots: [
          { src: "/images/projects/screenshots/dadok-login.png", alt: "Dadok 로그인 실제 실행 화면", caption: "Login" },
          { src: "/images/projects/screenshots/dadok-groups.png", alt: "Dadok 독서 모임 검색 실제 실행 화면", caption: "Groups" },
          { src: "/images/projects/screenshots/dadok-library.png", alt: "Dadok 내서재 실제 실행 화면", caption: "Library" },
        ],
      },
      {
        number: "05",
        kicker: "블록체인 공동구매 플랫폼",
        title: "Ssafari Campus",
        context: "삼성 청년 SW 아카데미",
        description: "공동구매와 코인 거래를 결합한 플랫폼. React, Redux, Web3, MetaMask 연동 경험을 쌓았습니다.",
        tags: ["React", "Redux", "Web3", "Solidity"],
        tone: "accent",
        screenshotLayout: "square",
        screenshots: [
          { src: "/images/projects/screenshots/ssafari-landing.png", alt: "Ssafari Campus 랜딩 실제 실행 화면", caption: "Landing" },
          { src: "/images/projects/screenshots/ssafari-main.png", alt: "Ssafari Campus 공동구매 상품 목록 실제 실행 화면", caption: "Market" },
          { src: "/images/projects/screenshots/ssafari-detail.png", alt: "Ssafari Campus 상품 상세 실제 실행 화면", caption: "Detail" },
        ],
      },
    ],
  },
];

export const educationItems = [
  {
    index: "01",
    type: "핀테크 · 개발",
    title: "핀테크 인턴십 코스(개발) 4기",
    status: "수료",
    meta: [
      ["기간", "2023.06 ~ 2023.08"],
      ["시간", "400시간"],
      ["기관", "코스콤"],
    ],
    summary: "Next.js 기반 금융 서비스 개발 및 핀테크 서비스 프로젝트를 수행했습니다.",
  },
  {
    index: "02",
    type: "웹 개발 · 팀 프로젝트",
    title: "SSAFY(삼성청년SW아카데미) 7기",
    status: "수료",
    meta: [
      ["기간", "2022.01 ~ 2022.12"],
      ["시간", "1,600시간"],
      ["기관", "멀티캠퍼스"],
    ],
    summary: "웹 개발 기반 교육, 알고리즘 학습 및 팀 프로젝트 개발을 수행했습니다.",
  },
  {
    index: "03",
    type: "데이터 분석",
    title: "빅데이터 분석가 양성 과정",
    status: "수료",
    meta: [
      ["기간", "2021.04 ~ 2021.10"],
      ["시간", "960시간"],
      ["기관", "세종산학협력관"],
    ],
    summary: "Python 기반 데이터 분석, 데이터 전처리 및 빅데이터 분석 기초를 학습했습니다.",
  },
] as const;

export const skillCards = [
  {
    title: "UI Engineering",
    description: "반응형 레이아웃, 폼, 모달, 캘린더, 차트, 녹음 UI처럼 실제 서비스에서 반복적으로 쓰이는 화면 요소를 구현했습니다.",
  },
  {
    title: "State & Data",
    description: "React Query, Recoil, Vuex를 활용해 서버 상태, 캐시, 전역 UI 상태, 사용자 입력 흐름을 분리해 다뤘습니다.",
  },
  {
    title: "Architecture",
    description: "FSD 구조와 Public API 규칙을 적용하며 기능이 늘어도 찾기 쉽고 바꾸기 쉬운 프론트엔드 구조를 고민했습니다.",
  },
  {
    title: "Product Sense",
    description: "회의록, 지출 관리, 독서 모임, 거래 플랫폼처럼 도메인이 다른 프로젝트에서 사용자 작업 흐름을 먼저 잡고 화면을 설계했습니다.",
  },
] as const;
