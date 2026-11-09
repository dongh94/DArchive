import type { Ref } from "react";

const SKIN = "#f5dcc8";
const SKIN_SHADE = "#e9c4aa";
const HAIR = "#191615";
const SUIT = "#262b36";
const SUIT_DARK = "#1c2029";
const SUIT_BACK = "#161a22";
const TIE = "#3c4d70";

function FrontArm({ className, x }: { className: string; x: number }) {
  return (
    <g className={`gallery-avatar-limb ${className}`}>
      <rect x={x} y="47" width="8" height="22" rx="4" fill={SUIT} />
      <rect x={x} y="64" width="8" height="3" fill="#f7f7f5" />
      <circle cx={x + 4} cy="70" r="3.6" fill={SKIN} />
    </g>
  );
}

function FrontLeg({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="72" width="8.5" height="22" rx="3.5" fill={SUIT_DARK} />
      <rect x={x - 1} y="90" width="11" height="6" rx="3" fill="#0f0f10" />
    </g>
  );
}

/** Standing pose: faces the visitor, like the résumé photo. */
function FrontView() {
  return (
    <g className="gallery-avatar-front">
      <FrontLeg x={34} />
      <FrontArm className="gallery-avatar-arm-right" x={45} />

      <g className="gallery-avatar-bob">
        <rect x="28" y="38" width="8" height="8" rx="2" fill={SKIN_SHADE} />
        <rect x="16" y="44" width="32" height="31" rx="9" fill={SUIT} />
        <path d="M25 44 L39 44 L32 60 Z" fill="#fbfbfa" />
        <path d="M25 44 L32 60 L27.5 61 L22 46 Z" fill={SUIT_DARK} />
        <path d="M39 44 L32 60 L36.5 61 L42 46 Z" fill={SUIT_DARK} />
        <rect x="30.2" y="45" width="3.6" height="3" rx="1" fill={TIE} />
        <path d="M30.4 48 L33.6 48 L34.6 58 L32 61 L29.4 58 Z" fill={TIE} />
        <path d="M30 51.5 L34 49.5 M29.8 55 L34.3 52.8 M30.2 58.3 L34.5 56.2" stroke="#e8e6e3" strokeWidth="0.6" />
        <path d="M29.9 53.2 L34.1 51.1 M30 56.6 L34.4 54.5" stroke="#b5504a" strokeWidth="0.5" />

        <circle cx="17.2" cy="27.5" r="3" fill={SKIN_SHADE} />
        <circle cx="46.8" cy="27.5" r="3" fill={SKIN_SHADE} />
        <ellipse cx="32" cy="26" rx="14.6" ry="15.4" fill={SKIN} />
        <path
          d="M16.6 28 C13.4 14 19 2.6 31.6 1.8 C44.8 1.2 51.2 10.4 47.8 26 C47 22 46 19.6 44.4 18 C42.8 20.6 39.8 21.6 36.8 21 C35.4 18.6 33.4 17.4 31.2 17.6 C29 19.8 26 21.6 22.4 21.9 C20 23.4 18.2 25.4 16.6 28 Z"
          fill={HAIR}
        />
        <path d="M31.2 17.6 C29.6 12.6 32.6 8 38 7.2" stroke="#3a3330" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M23.5 8.6 C27.8 4.8 36.4 4.4 41.6 8.6" stroke="#3a3330" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        <path d="M22.6 23.6 Q25.8 22.4 29 23.4" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M35 23.4 Q38.2 22.4 41.4 23.6" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="26" cy="27.4" rx="2.1" ry="1.35" fill="#2a201b" />
        <ellipse cx="38" cy="27.4" rx="2.1" ry="1.35" fill="#2a201b" />
        <circle cx="26.6" cy="27" r="0.45" fill="#ffffff" />
        <circle cx="38.6" cy="27" r="0.45" fill="#ffffff" />
        <path d="M32.4 29.4 Q33.4 32.2 31.4 32.6" stroke="#d9a98c" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M28.4 35.2 Q32 37.6 35.6 35.2" stroke="#b9675a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <ellipse cx="22.6" cy="32.4" rx="2.2" ry="1.2" fill="#f1a99a" opacity="0.35" />
        <ellipse cx="41.4" cy="32.4" rx="2.2" ry="1.2" fill="#f1a99a" opacity="0.35" />
      </g>

      <FrontLeg x={21.5} />
      <FrontArm className="gallery-avatar-arm-wave" x={11} />
    </g>
  );
}

function SideLeg({ className, fill }: { className: string; fill: string }) {
  return (
    <g className={`gallery-avatar-limb gallery-avatar-hip ${className}`}>
      <rect x="27.5" y="70" width="11" height="23" rx="4.5" fill={fill} />
      <path d="M27 89.5 h13.5 a3.2 3.2 0 0 1 0 6.4 H27 Z" fill="#0f0f10" />
    </g>
  );
}

function SideArm({ className, fill }: { className: string; fill: string }) {
  return (
    <g className={`gallery-avatar-limb gallery-avatar-shoulder ${className}`}>
      <rect x="28.5" y="46" width="9.5" height="22" rx="4.75" fill={fill} />
      <rect x="28.5" y="63" width="9.5" height="3" fill="#f2f2f0" />
      <circle cx="33.25" cy="69.5" r="3.9" fill={SKIN} />
    </g>
  );
}

/** Walking pose: profile facing the direction of travel, limbs swing front and back. */
function SideView() {
  return (
    <g className="gallery-avatar-side">
      <SideArm className="gallery-avatar-swing-a" fill={SUIT_BACK} />
      <SideLeg className="gallery-avatar-swing-b" fill={SUIT_BACK} />

      <g className="gallery-avatar-bob">
        <rect x="29.5" y="38" width="7" height="8" rx="2" fill={SKIN_SHADE} />
        <path d="M23 50 C23 45.5 26 43.5 31 43.5 H38 C43.5 43.5 46.5 46.5 46.8 52 L47 66 C47 72 44 75.5 38.5 75.5 H28 C24 75.5 21.5 72.5 21.5 68 Z" fill={SUIT} />
        <path d="M39.5 44 L44 45.4 L43.2 58 L39.5 52.5 Z" fill="#fbfbfa" />
        <path d="M42 47.2 L44.2 47.8 L44 59 L42.3 60.6 Z" fill={TIE} />
        <path d="M39.5 44 L39.8 53 L42 60" stroke={SUIT_DARK} strokeWidth="1.4" fill="none" strokeLinecap="round" />

        <ellipse cx="34" cy="26" rx="14" ry="15.4" fill={SKIN} />
        <path d="M47.2 26.5 Q50.4 30.4 47.4 32.2" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="0.8" />
        <circle cx="28.8" cy="28" r="3.1" fill={SKIN_SHADE} />
        <path
          d="M20.2 31 C16.4 15.6 23.4 2.8 35.4 2.4 C46.4 2 51.8 10.4 49 21.4 C47 19.6 44.4 18.8 41.6 19.6 C39.4 17.6 35.8 17.2 33 18.8 C31.4 21.6 30.6 24.2 31.4 27 C29 26 26.6 26.8 25.6 29.4 C24.2 31.4 22 32 20.2 31 Z"
          fill={HAIR}
        />
        <path d="M27 8.2 C32 4.6 40.4 4.6 45.4 9.4" stroke="#3a3330" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        <path d="M39.4 23.4 Q42.4 22.4 45.2 23.6" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="42.6" cy="27.4" rx="1.6" ry="1.35" fill="#2a201b" />
        <circle cx="43.1" cy="27" r="0.4" fill="#ffffff" />
        <path d="M42.2 35.4 Q44.6 36.4 46.4 34.8" stroke="#b9675a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <ellipse cx="40.6" cy="32" rx="2" ry="1.1" fill="#f1a99a" opacity="0.35" />
      </g>

      <SideLeg className="gallery-avatar-swing-a" fill={SUIT_DARK} />
      <SideArm className="gallery-avatar-swing-b" fill={SUIT} />
    </g>
  );
}

export function GalleryAvatar({ accent, avatarRef }: { accent: string; avatarRef: Ref<HTMLDivElement> }) {
  return (
    <div ref={avatarRef} className="gallery-avatar" data-walking="false" data-facing="right" aria-hidden="true">
      <span className="gallery-avatar-tag" style={{ boxShadow: `inset 0 -2px 0 ${accent}` }}>
        DH
      </span>
      <svg className="gallery-avatar-body" viewBox="0 0 64 104" width="64" height="104">
        <ellipse cx="32" cy="99" rx="17" ry="3.5" className="gallery-avatar-shadow" />
        <FrontView />
        <SideView />
      </svg>
    </div>
  );
}
