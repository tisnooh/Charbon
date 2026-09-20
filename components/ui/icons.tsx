import type { SVGProps } from 'react';

/**
 * Icônes CHARBON — trait fin, courant (currentColor), cohérentes
 * avec le langage visuel de l'application.
 */

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function Icon({ children, className = 'h-5 w-5', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Spark = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2c.8 5.4 3.6 8.2 9 9-5.4.8-8.2 3.6-9 9-.8-5.4-3.6-8.2-9-9 5.4-.8 8.2-3.6 9-9z" />
  </Icon>
);

export const Flame = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 22c4 0 7-2.9 7-6.8 0-2.6-1.4-4.9-2.7-6.3-.4 1.3-1.2 2-2.1 2.2.3-2.6-.8-5.3-3.2-7.1.2 2.3-.8 3.9-2 5.2C7.3 10.9 5 12.9 5 15.2 5 19.1 8 22 12 22z" />
  </Icon>
);

export const Check = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
);

export const Minus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const X = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const ChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);

export const ChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 9l7 7 7-7" />
  </Icon>
);

export const ArrowUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 19V5m-6 6l6-6 6 6" />
  </Icon>
);

export const Target = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const Crosshair = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" />
  </Icon>
);

export const TrendUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 16l5-5 3.5 3.5L20 7m0 0h-5m5 0v5" />
  </Icon>
);

export const Calendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M4 10h16M8 3v4M16 3v4" />
  </Icon>
);

export const Clock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const BarsChart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 20V10M12 20V4M18 20v-7" strokeWidth={2} />
  </Icon>
);

export const User = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </Icon>
);

/** Pastille profil de la tab bar app : disque plein + silhouette découpée. */
export const UserDisc = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="9.8" r="3.3" fill="#0C0C0C" stroke="none" />
    <path d="M5.4 18.2c1.3-2.8 3.7-4.3 6.6-4.3s5.3 1.5 6.6 4.3z" fill="#0C0C0C" stroke="none" />
  </Icon>
);

export const Pencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" />
  </Icon>
);

export const Menu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const Close = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const Lock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 118 0v4" />
  </Icon>
);

export const Info = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);

export const Wifi = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 9.5a14 14 0 0120 0M5 12.5a10 10 0 0114 0M8 15.5a6 6 0 018 0" />
    <circle cx="12" cy="19" r="0.8" fill="currentColor" stroke="none" />
  </Icon>
);

export const Signal = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 18v-3M9.7 18v-6M14.3 18v-9M19 18V6" strokeWidth={2.2} />
  </Icon>
);

export const Battery = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="8" width="18" height="9" rx="2.5" />
    <path d="M22 11.2v2.6" strokeWidth={2} />
    <rect x="4" y="10" width="11" height="5" rx="1" fill="currentColor" stroke="none" />
  </Icon>
);
