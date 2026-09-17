/** Jeu d'icônes SVG inline (trait 1.8, style iOS) — zéro dépendance externe. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export const FlameIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3c.5 3-1.5 4.5-3 6.5C7.5 11.5 7 13 7 14.5A5 5 0 0 0 12 20a5 5 0 0 0 5-5.5c0-2-1-3.5-2-5-.5 1-1.5 1.5-2 1.5.8-2.5.3-5.5-1-8Z" />
  </svg>
);

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5Z" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const CheckSquareIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);

export const RepeatIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9a5 5 0 0 1 5-5h9m0 0-2.5-2.5M18 4l-2.5 2.5M20 15a5 5 0 0 1-5 5H6m0 0 2.5 2.5M6 20l2.5-2.5" />
  </svg>
);

export const ListIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
);

export const TargetIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

export const ChartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 20V10m5 10V4m5 16v-7m4 7H4" />
  </svg>
);

export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c1-3.5 3.8-5 7-5s6 1.5 7 5" />
  </svg>
);

export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" />
    <path d="M10 19a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const XIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 7h15M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7m2 0-.8 12a1.5 1.5 0 0 1-1.5 1.4H8.1a1.5 1.5 0 0 1-1.5-1.4L5.8 7" />
  </svg>
);

export const PencilIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15.5 4.5 19 8 8.5 18.5 4 20l1.5-4.5L15.5 4.5Z" />
  </svg>
);

export const PauseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);

export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4.8v14.4L19 12 7 4.8Z" />
  </svg>
);

export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8l1.4 2.3 2.7-.5 1 2.5 2.5 1-.5 2.7 2.3 1.4v2.8l-2.3 1.4.5 2.7-2.5 1-1 2.5-2.7-.5L12 21.2l-1.4-2.3-2.7.5-1-2.5-2.5-1 .5-2.7L2.6 12V9.2l2.3-1.4-.5-2.7 2.5-1 1-2.5 2.7.5L12 2.8Z" transform="scale(0.92) translate(1 1)" />
  </svg>
);

export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

export const LogoutIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7m2-9 4 4-4 4m4-4H9" />
  </svg>
);

export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="15" rx="3" />
    <path d="M8 3v4m8-4v4M4 10.5h16" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3 1.8" />
  </svg>
);

export const SunIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.2 5.2l1.4 1.4m10.8 10.8 1.4 1.4m0-13.6-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </svg>
);

export const CrownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 17 3 7l5.5 4L12 4l3.5 7L21 7l-1 10H4Z" />
  </svg>
);

/** Logo Charbon : briquette de charbon + braise. */
export const CharbonMark = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="emberGrad" x1="12" y1="40" x2="36" y2="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#FF6B35" />
      </linearGradient>
      <linearGradient id="coalGrad" x1="10" y1="12" x2="38" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3A3D46" />
        <stop offset="1" stopColor="#17181D" />
      </linearGradient>
    </defs>
    <path
      d="M24 4 40 13v22L24 44 8 35V13L24 4Z"
      fill="url(#coalGrad)"
      stroke="rgba(255,255,255,0.14)"
      strokeWidth="1.5"
    />
    <path
      d="M24 14c.7 4.2-2 6.3-4.2 9.1-2 2.6-2.6 4.6-2.6 6.7A6.8 6.8 0 0 0 24 37a6.8 6.8 0 0 0 6.8-7.2c0-2.7-1.4-4.9-2.8-7-.7 1.4-2 2.1-2.8 2.1 1.2-3.5.4-7.6-1.2-10.9Z"
      fill="url(#emberGrad)"
    />
  </svg>
);
