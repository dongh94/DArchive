import { projectGroups, type ProjectItem, type ProjectScreenshot } from "@/features/projects/data/projects-content";
import { experienceProjects, type ExperienceProject } from "./experience-content";

export type WingId = "developer" | "engineer";

export type ExhibitKind = "training" | "main" | "guild" | "side" | "boss" | "skill" | "trophy";

export type Exhibit = {
  id: string;
  kind: ExhibitKind;
  period: string;
  title: string;
  subtitle: string;
  summary: string;
  role?: string;
  tech: string[];
  details: string[];
  result?: string;
  badge?: string;
  images?: ProjectScreenshot[];
  imageLayout?: "phone" | "square";
};

export type GalleryZone = {
  id: string;
  title: string;
  caption: string;
  exhibits: Exhibit[];
};

export type GalleryDoor = {
  id: string;
  label: string;
  title: string;
  period: string;
  href: string;
  accent: string;
};

export type GalleryWing = {
  id: WingId;
  label: string;
  title: string;
  period: string;
  intro: string;
  accent: string;
  zones: GalleryZone[];
};

export const exhibitKindLabels: Record<ExhibitKind, string> = {
  training: "Training",
  main: "Main quest",
  guild: "Guild quest",
  side: "Side quest",
  boss: "Boss raid",
  skill: "Skill tree",
  trophy: "Achievement",
};

function findExperienceProject(number: string): ExperienceProject {
  const project = experienceProjects.find((item) => item.number === number);

  if (!project) {
    throw new Error(`Unknown experience project: ${number}`);
  }

  return project;
}

function findProjectItem(title: string): ProjectItem {
  const project = projectGroups.flatMap((group) => group.projects).find((item) => item.title === title);

  if (!project) {
    throw new Error(`Unknown project item: ${title}`);
  }

  return project;
}

function fromExperienceProject(
  number: string,
  overrides: Pick<Exhibit, "id" | "kind" | "subtitle"> & Partial<Exhibit>,
): Exhibit {
  const project = findExperienceProject(number);

  return {
    period: project.period,
    title: project.title,
    summary: project.overview,
    role: project.role,
    tech: project.technologies,
    details: project.achievements,
    ...overrides,
  };
}

function fromProjectItem(title: string, overrides: Pick<Exhibit, "id" | "kind" | "period"> & Partial<Exhibit>): Exhibit {
  const project = findProjectItem(title);

  return {
    title: project.title,
    subtitle: project.kicker,
    summary: project.description,
    tech: project.tags,
    details: project.highlights ?? [],
    images: project.screenshots,
    imageLayout: project.screenshotLayout,
    ...overrides,
  };
}

const developerWing: GalleryWing = {
  id: "developer",
  label: "Developer wing",
  title: "프론트엔드 엔지니어",
  period: "2021 – 2026.05",
  intro: "교육 과정에서 시작해 클라우드 관리 플랫폼(CMP) 콘솔과 공통 구조를 만들기까지의 기록입니다.",
  accent: "#4285f4",
  zones: [
    {
      id: "prologue",
      title: "Prologue",
      caption: "교육 과정과 첫 프로젝트",
      exhibits: [
        {
          id: "bigdata-course",
          kind: "training",
          period: "2021.04 – 2021.10",
          title: "빅데이터 분석가 양성 과정",
          subtitle: "세종산학협력관 · 960시간",
          summary: "Python 기반 데이터 수집·분석을 배우고, React로 유기동물 입양 플랫폼을 만들었습니다.",
          role: "프론트엔드 개발 & 데이터 분석",
          tech: ["React", "Python", "Selenium", "Pandas", "Matplotlib"],
          details: [
            "직영 유기동물센터를 방문해 요구사항을 수집했습니다.",
            "Python·Selenium으로 데이터를 크롤링하고 Pandas로 가공했습니다.",
            "중소기업 연계 프로젝트를 수행했습니다.",
          ],
          badge: "데이터 분석 발표 우수상",
        },
        fromProjectItem("Dadok", {
          id: "ssafy",
          kind: "training",
          period: "2022.01 – 2022.12",
          title: "SSAFY 7기 · Dadok",
          subtitle: "삼성 청년 SW 아카데미 · 1,600시간",
          role: "프론트엔드 & 백엔드 개발",
          details: [
            "독서 모임 플랫폼 Dadok에서 Matter.js 게이미피케이션 UI와 실시간 화상 모임을 구현했습니다.",
            "Solidity·MetaMask를 연동한 블록체인 공동구매 플랫폼을 개발했습니다.",
            "Git 기반 형상 관리, 애자일 협업, 코드 리뷰를 경험했습니다.",
          ],
          badge: "자율 프로젝트 우수상",
        }),
        fromProjectItem("Moang", {
          id: "koscom",
          kind: "training",
          period: "2023.06 – 2023.08",
          title: "코스콤 핀테크 인턴십 · Moang",
          subtitle: "팀 리더 · 400시간",
          role: "프론트엔드 개발 (팀 리더)",
          details: [
            "팀 리더로서 프로젝트 일정과 품질을 관리했습니다.",
            "반응형 웹 디자인과 주요 화면 설계, 가계부 등록·계산 로직을 담당했습니다.",
            "Next.js App Router 기반 PWA 모바일 화면 흐름을 구성했습니다.",
          ],
          badge: "해커톤 우수상",
        }),
      ],
    },
    {
      id: "cmp",
      title: "Okestro CMP",
      caption: "클라우드 관리 플랫폼 콘솔",
      exhibits: [
        fromExperienceProject("05", {
          id: "finance-legacy",
          kind: "main",
          subtitle: "JSP → Vue SPA 전환",
          title: "금융권 CI/CD 차세대 시스템",
        }),
        fromExperienceProject("04", {
          id: "public-cmp",
          kind: "main",
          subtitle: "AWS · NCP 자원 관리 콘솔",
          result: "2025년 성과 기록 기준 신규 화면·기능 20개 이상을 일정 내 완료하고 QA 이슈 40건 이상을 해결했습니다.",
        }),
        {
          id: "security-certification",
          kind: "boss",
          period: "2024",
          title: "보안 기능 확인서 대응 개발",
          subtitle: "약 2개월 반 집중 개발",
          summary: "클라우드 관리 플랫폼의 보안 기능 확인서 취득을 위해 AWS 기능 개발과 QA 대응을 수행했습니다.",
          role: "AWS 콘솔 기능 개발 및 QA 대응",
          tech: ["Vue 3", "TypeScript", "AWS"],
          details: [
            "인스턴스 관리 등 6개 이상의 핵심 화면을 구현했습니다.",
            "볼륨·보안그룹 조회, 키페어 관리, VPC·Subnet 조회 등 10여 개 세부 기능을 구현했습니다.",
          ],
          result: "담당 기능의 구현과 안정화로 플랫폼 보안 기능 확인서 취득에 기여했습니다.",
          badge: "Clear",
        },
        fromExperienceProject("03", {
          id: "private-cmp",
          kind: "main",
          subtitle: "VMware · NSX 콘솔",
        }),
        fromExperienceProject("02", {
          id: "design-system",
          kind: "guild",
          subtitle: "useCmpForm · Storybook",
          result: "Create Layout을 포함한 8개 주요 과제를 완료하고, 생성 화면을 일관된 패턴으로 개발하는 기반을 마련했습니다.",
        }),
        fromExperienceProject("01", {
          id: "monorepo",
          kind: "guild",
          subtitle: "Module Federation → Nx 모노레포",
        }),
      ],
    },
    {
      id: "side",
      title: "Side projects",
      caption: "업무 밖에서 만든 것들",
      exhibits: [
        fromProjectItem("MODAK", { id: "modak", kind: "side", period: "사내 프로젝트" }),
        fromProjectItem("한끼오케", { id: "hankki", kind: "side", period: "사내 프로젝트" }),
        {
          id: "d-archive",
          kind: "side",
          period: "2026 – 현재",
          title: "D-Archive",
          subtitle: "지금 보고 있는 이 사이트",
          summary: "경력과 기록을 모아 두는 개인 아카이브입니다. 모바일 청첩장, Stock Lab, 그리고 이 전시관을 직접 기획하고 구현했습니다.",
          tech: ["Next.js", "TypeScript", "tRPC", "Prisma", "Tailwind"],
          details: [
            "pnpm 모노레포로 웹 앱, API, DB 패키지를 분리했습니다.",
            "실제 필요에서 출발한 모바일 청첩장의 정보 구조와 사용자 흐름을 설계했습니다.",
            "경력을 걸어 다니며 보는 전시관 형태로 다시 표현했습니다.",
          ],
        },
      ],
    },
  ],
};

const engineerWing: GalleryWing = {
  id: "engineer",
  label: "Engineer wing",
  title: "클라우드 엔지니어",
  period: "2026.06 – 현재",
  intro: "클라우드 기술본부 PS 팀에서 OpenStack 기반 고객 환경의 장애를 분석하고 복구한 기록입니다.",
  accent: "#34a853",
  zones: [
    {
      id: "transition",
      title: "Job change",
      caption: "화면에서 인프라로",
      exhibits: [
        {
          id: "transition",
          kind: "main",
          period: "2026.06",
          title: "프론트엔드에서 클라우드 엔지니어로",
          subtitle: "클라우드 기술본부 · PS 팀",
          summary:
            "제품 개발에서 쌓은 자원 관리 흐름과 API 이해를 바탕으로, 고객 환경의 기술 지원과 운영 문제 해결로 업무 범위를 넓혔습니다.",
          tech: ["OpenStack", "Linux", "Networking"],
          details: [
            "화면에서 시작한 문제를 API, 가상화, Guest OS, 스토리지와 네트워크까지 연결해 이해합니다.",
            "운영 문제는 로그와 정상 환경의 차이를 근거로 좁혀 갑니다.",
            "분석 근거, 조치, 검증 결과를 문서로 남겨 팀의 지식으로 공유합니다.",
          ],
        },
      ],
    },
    {
      id: "lab",
      title: "OpenStack lab",
      caption: "직접 구축하며 익힌 것들",
      exhibits: [
        {
          id: "openstack-core",
          kind: "skill",
          period: "2026.08",
          title: "OpenStack Ussuri 구성 요소",
          subtitle: "Keystone부터 Horizon까지",
          summary: "OpenStack 핵심 서비스의 역할과 구축 절차를 하나씩 정리하며 운영 환경을 읽는 기반을 만들었습니다.",
          tech: ["Keystone", "Glance", "Placement", "Nova", "Neutron", "Cinder", "Horizon"],
          details: [
            "구축 사전 환경부터 서비스별 설치·설정 절차를 정리했습니다.",
            "서비스 간 인증과 요청 흐름을 이해해 장애 로그를 해석하는 데 활용하고 있습니다.",
          ],
        },
        {
          id: "secure-transport",
          kind: "skill",
          period: "2026.08",
          title: "SSH · HTTPS 통신 원리",
          subtitle: "하이브리드 암복호화",
          summary: "인스턴스 SSH 접속과 Apache 웹 서버의 HTTPS 처리 과정을 암복호화 관점에서 정리했습니다.",
          tech: ["SSH", "Apache", "TLS"],
          details: [
            "OpenStack 환경의 SSH 원격 접속 흐름과 키 교환 과정을 정리했습니다.",
            "Apache 웹 서버와 HTTPS 인증서 처리 흐름을 정리했습니다.",
          ],
        },
        {
          id: "octavia",
          kind: "skill",
          period: "2026.10",
          title: "Octavia L4 로드밸런서",
          subtitle: "TCP 분산 · Amphora HA",
          summary: "Octavia로 L4 로드밸런서를 구축하고 TCP 분산과 Amphora 이중화 동작을 실습했습니다.",
          tech: ["Octavia", "Amphora", "TCP LB"],
          details: ["로드밸런서 구축부터 TCP 분산, Amphora HA 전환까지 직접 검증했습니다."],
        },
        {
          id: "vxlan",
          kind: "skill",
          period: "2026.11",
          title: "VXLAN · L3 Router · Security Group",
          subtitle: "테넌트 네트워크 실습",
          summary: "VXLAN 테넌트 네트워크와 L3 라우터, 보안 그룹을 구성하고 통신 결과를 검증했습니다.",
          tech: ["Neutron", "VXLAN", "L3 Router", "Security Group"],
          details: ["네트워크 구성 이후 실제 트래픽 흐름과 차단 규칙을 단계별로 확인했습니다."],
        },
      ],
    },
    {
      id: "field",
      title: "Field cases",
      caption: "고객 환경 기술 지원",
      exhibits: [
        {
          id: "vm-boot-recovery",
          kind: "boss",
          period: "2026",
          title: "VM 부팅 장애 복구",
          subtitle: "의료기관 · VM 3대",
          summary: "정상 기동되지 않는 VM 3대의 부팅 영역과 네트워크 설정을 단계별로 복구했습니다.",
          role: "장애 분석 및 복구",
          tech: ["OpenStack", "Guest OS", "UEFI", "Cloud-init", "Netplan"],
          details: [
            "OpenStack·Hypervisor 상태와 Guest OS 콘솔을 확인하고 부팅 파티션과 파일시스템 문제를 점검했습니다.",
            "OS 볼륨을 복구용 VM에 연결해 Root·Boot·UEFI 영역을 점검·복구하고 마운트와 파일 접근을 확인했습니다.",
            "복구 후에도 통신되지 않는 VM은 IP와 Default Gateway 불일치를 찾아 Cloud-init·Netplan 설정을 보정했습니다.",
          ],
          result: "대상 VM 3대의 정상 기동과 통신을 확인했습니다. 부팅 복구와 네트워크 정상화를 나눠 단계별로 검증했습니다.",
          badge: "Clear",
        },
        {
          id: "config-drive",
          kind: "main",
          period: "2026",
          title: "신규 인스턴스 초기 설정 미적용",
          subtitle: "교육기관 · Config Drive",
          summary: "인스턴스는 생성되지만 초기 계정 설정이 반영되지 않는 문제의 원인을 찾아 전달 경로를 정상화했습니다.",
          role: "원인 분석 및 설정 반영",
          tech: ["Nova", "Cloud-init", "Config Drive", "Windows image"],
          details: [
            "Cloud-init 로그와 Nova 인스턴스 정보를 비교했습니다.",
            "User-Data는 저장되어 있으나 Guest OS가 데이터 소스를 인식하지 못하는 점을 확인하고, 정상 환경과 Config Drive 설정 차이를 분석했습니다.",
            "Controller·Compute 노드 설정을 반영하고 신규 인스턴스와 Windows 이미지 인스턴스의 부팅·로그인을 검증했습니다.",
          ],
          result: "초기 설정 전달 경로를 정상화하고, 이미지 Virtual Size를 고려한 OS 볼륨 크기 안내까지 수행했습니다.",
          badge: "Clear",
        },
      ],
    },
  ],
};

export const galleryWings: Record<WingId, GalleryWing> = {
  developer: developerWing,
  engineer: engineerWing,
};

export const lobbyContent = {
  name: "김동희",
  role: "Cloud & Frontend Engineer",
  intro: "클라우드 플랫폼 개발 경험을 고객 인프라 운영과 문제 해결로 넓혀 온 엔지니어입니다.",
  doors: [
    {
      id: "developer",
      label: developerWing.label,
      title: developerWing.title,
      period: developerWing.period,
      href: "/experience/developer",
      accent: developerWing.accent,
    },
    {
      id: "engineer",
      label: engineerWing.label,
      title: engineerWing.title,
      period: engineerWing.period,
      href: "/experience/engineer",
      accent: engineerWing.accent,
    },
  ] satisfies GalleryDoor[],
  trophies: {
    id: "certifications",
    kind: "trophy",
    period: "2013 – 2022",
    title: "자격증 진열장",
    subtitle: "5개 획득",
    summary: "데이터, 정보처리, 회계 분야에서 취득한 자격증입니다.",
    tech: ["정보처리기사", "빅데이터 분석기사", "ADsP", "SQLD", "전산세무2급"],
    details: [
      "정보처리기사 · 2022.11 · 한국산업인력공단",
      "빅데이터 분석기사 · 2022.07 · 한국데이터산업진흥원",
      "ADsP · 2021.12 · 한국데이터산업진흥원",
      "SQLD · 2021.10 · 한국데이터산업진흥원",
      "전산세무2급 · 2013.12 · 한국세무사회",
    ],
  } satisfies Exhibit,
};
