export type ExperienceProject = {
  number: string;
  title: string;
  period: string;
  overview: string;
  role: string;
  technologies: string[];
  achievements: string[];
};



export const experienceProjects: ExperienceProject[] = [
  {
    number: "01",
    title: "내부 솔루션 모노레포 리뉴얼 개발",
    period: "2025.07 ~ 현재",
    overview:
      "기존 내부 솔루션의 프론트엔드 구조를 개선하고, 여러 제품군에서 공통으로 활용할 수 있는 모노레포 기반 개발 환경을 구축하는 프로젝트입니다. 제품별로 흩어져 있던 구조를 정리하고, 공통 템플릿과 아키텍처 기준을 마련하여 개발 효율성과 확장성을 높이는 것을 목표로 했습니다.",
    role: "프론트엔드 개발자로 참여하여 화면 개발과 공통 구조 설계, 모노레포 환경 구성, 페이지 및 컴포넌트 개발을 담당했습니다.",
    technologies: ["Vue3 Composition API", "Storybook", "Vite", "Pnpm", "Nx", "Monorepo", "FSD"],
    achievements: [
      "Nx, Pnpm 기반의 모노레포 구조를 활용하여 여러 내부 솔루션에서 공통으로 사용할 수 있는 프론트엔드 개발 환경 구성에 참여했습니다.",
      "Feature-Sliced Design 구조를 적용하여 기능 단위의 책임을 분리하고, 페이지·위젯·공통 컴포넌트 간 의존성을 정리했습니다.",
      "제품별 반복되는 화면 구조를 공통 템플릿으로 개발하여 신규 화면 개발 시 초기 세팅 비용을 줄이고, 팀 내 개발 방식의 일관성을 높였습니다.",
      "ABAC 기반 권한 정책을 고려한 페이지 및 컴포넌트를 개발하여 사용자 권한에 따라 접근 가능한 기능과 화면이 제어되도록 구현했습니다.",
      "퍼블릭 클라우드 및 프라이빗 클라우드 콘솔 리뉴얼 개발에 참여하여 기존 기능의 사용성과 유지보수성을 개선했습니다.",
    ],
  },
  {
    number: "02",
    title: "내부 솔루션 디자인 시스템 개발 TF",
    period: "2025.04 ~ 현재",
    overview:
      "내부 솔루션 전반에서 공통으로 사용할 디자인 시스템과 UI 컴포넌트 문서화 환경을 구축하는 TF 프로젝트입니다. 화면마다 다르게 구현되던 UI 패턴을 정리하고, 공통 컴포넌트 사용 기준을 마련하는 것을 목표로 했습니다.",
    role: "프론트엔드 개발자로 참여하여 Storybook 환경 구축, 공통 컴포넌트 문서화, 레이아웃 예시 코드 작성 등을 담당했습니다.",
    technologies: ["Vue3 Composition API", "Storybook", "Vite", "Pnpm", "Nx", "Monorepo"],
    achievements: [
      "Storybook을 도입하여 공통 컴포넌트의 사용 예시와 상태별 UI를 문서화했습니다.",
      "페이지별 Layout 구조와 예시 코드를 작성하여 개발자가 동일한 기준으로 화면을 구성할 수 있도록 지원했습니다.",
      "디자인 시스템과 실제 제품 개발 환경 간의 간극을 줄이기 위해 컴포넌트 사용 방식, props 구조, 예시 패턴을 정리했습니다.",
      "반복적으로 사용되는 UI 패턴을 공통화하여 개발 생산성과 화면 품질의 일관성을 높이는 데 기여했습니다.",
    ],
  },
  {
    number: "03",
    title: "Okestro CMP 프라이빗 플랫폼 콘솔 개발",
    period: "2025.01 ~ 2025.03",
    overview:
      "VMware 및 NSX 기반의 프라이빗 클라우드 관리 기능을 내부 CMP 솔루션으로 제품화하는 프로젝트입니다. 사용자가 프라이빗 클라우드 자원과 네트워크 보안 정책을 웹 콘솔에서 관리할 수 있도록 기능을 개발했습니다.",
    role: "프론트엔드 개발자로 참여하여 VMware 자원 관리 화면과 NSX 네트워크 관련 기능 개발을 담당했습니다.",
    technologies: ["Vue3 Composition API", "TypeScript", "Pinia", "VeeValidate", "TanStack Query", "Module Federation", "VMware", "NSX"],
    achievements: [
      "VMware 기반의 폴더 및 자원 이동 기능을 구현하여 사용자가 콘솔에서 가상화 자원을 관리할 수 있도록 개발했습니다.",
      "NSX 네트워크 영역의 Gateway Firewall, Firewall Policy 등 보안 정책 관리 화면을 개발했습니다.",
      "TanStack Query를 활용하여 서버 상태 관리와 API 호출 흐름을 정리하고, 데이터 조회·변경 이후의 갱신 로직을 안정적으로 처리했습니다.",
      "VeeValidate 기반의 Form 검증 로직을 적용하여 입력값 검증과 사용자 피드백 흐름을 개선했습니다.",
      "프라이빗 클라우드 도메인에 대한 이해를 바탕으로 복잡한 인프라 기능을 웹 콘솔에서 사용하기 쉬운 형태로 구현했습니다.",
    ],
  },
  {
    number: "04",
    title: "Okestro CMP 퍼블릭 플랫폼 개발",
    period: "2024.01 ~ 2024.12",
    overview:
      "AWS 및 NCP 기반의 퍼블릭 클라우드 자원 관리 기능을 내부 CMP 솔루션으로 제품화하는 프로젝트입니다. 사용자가 다양한 클라우드 자원을 하나의 웹 콘솔에서 조회, 생성, 수정, 삭제할 수 있도록 기능을 개발했습니다.",
    role: "프론트엔드 개발자로 참여하여 AWS/NCP 자원 관리 화면 개발, 공통 Form 구조 개선, 네트워크 자원 관리 기능 개발을 담당했습니다.",
    technologies: [
      "Vue3 Composition API",
      "TypeScript",
      "Pinia",
      "VeeValidate",
      "Ant Design Vue",
      "Axios",
      "ECharts",
      "CodeMirror",
      "TanStack Query",
      "Module Federation",
      "AWS",
      "NCP",
    ],
    achievements: [
      "AWS/NCP 주요 기능을 내부 퍼블릭 클라우드 관리 솔루션으로 제품화하는 데 참여했습니다.",
      "AWS 네트워크 자원 영역을 집중적으로 담당하여 VPC, Subnet, Routing Table, Security Group, Network ACL, Internet Gateway, Target Group, Auto Scaling 등 주요 자원 관리 화면을 개발했습니다.",
      "클라우드 자원별 생성·수정 Form에서 반복되는 입력 구조와 유효성 검증 로직을 모듈화하여 개발 생산성과 유지보수성을 개선했습니다.",
      "IP Pool 기능에서 VPC/Subnet 정보를 활용해 IP 사용 가능 수, 사용률 등 네트워크 자원 현황을 계산하고 시각적으로 제공하는 기능을 개발했습니다.",
      "Ant Design Vue 기반의 복잡한 Form UI와 테이블 화면을 구현하며, 대규모 관리 콘솔에서 필요한 사용자 흐름과 데이터 처리 구조를 경험했습니다.",
      "ECharts, CodeMirror 등을 활용하여 모니터링성 데이터와 코드성 입력 UI를 제품 요구사항에 맞게 구현했습니다.",
    ],
  },
  {
    number: "05",
    title: "KB IQ PLUS CI/CD 차세대 시스템 개발",
    period: "2023.09 ~ 2023.12",
    overview: "KB 내부 CI/CD 시스템의 차세대 전환 프로젝트로, 기존 JSP 기반 레거시 시스템을 Vue 기반 프론트엔드 구조로 마이그레이션하는 프로젝트입니다.",
    role: "프론트엔드 개발자로 참여하여 Vue 기반 화면 개발, IBSheet 기능 안정화, 테스트 코드 및 결재 라인 관련 화면 마이그레이션을 담당했습니다.",
    technologies: ["Vue.js", "TypeScript", "IBSheet", "JPQL"],
    achievements: [
      "기존 JSP 기반 화면을 Vue.js 기반 구조로 전환하는 마이그레이션 작업에 참여했습니다.",
      "KB ITQ PLUS CI/CD 환경에서 테스트 코드 및 결재 라인 관련 화면의 기능 이전을 지원했습니다.",
      "IBSheet 업그레이드와 기능 안정화를 담당하여 데이터 그리드 기반 화면의 동작 오류를 개선했습니다.",
      "레거시 시스템 구조와 신규 프론트엔드 구조를 함께 이해하며, 기존 업무 흐름을 유지하면서도 화면 구조를 개선하는 경험을 쌓았습니다.",
      "금융권 프로젝트 환경에서 개발 산출물 관리, 기능 검증, 안정성 중심의 개발 프로세스를 경험했습니다.",
    ],
  },
];
