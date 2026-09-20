import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'ghost' | 'quiet' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
  iconRight?: ReactNode;
  children: ReactNode;
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-ember-500 text-coal-950 font-semibold hover:bg-ember-400 active:bg-ember-600 shadow-[0_10px_30px_-14px_rgba(248,84,4,0.8)] hover:shadow-[0_16px_40px_-14px_rgba(248,84,4,0.55)]',
  ghost: 'border border-line-strong text-ink-100 hover:border-ink-600 hover:bg-coal-800/70',
  quiet: 'text-ink-400 hover:text-ink-100',
  dark: 'border border-line bg-coal-800 text-ink-100 hover:bg-coal-750 hover:border-line-strong',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-[38px] px-4 py-2 text-sm',
  md: 'min-h-[46px] px-6 py-3 text-[0.95rem]',
  lg: 'min-h-[54px] px-8 py-4 text-base',
};

function classes(variant: Variant, size: Size, full?: boolean) {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-pill font-medium',
    'transition-all duration-300 ease-ember active:scale-[0.985]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    full && 'w-full',
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', full, loading, iconRight, children } = props;

  if (props.href !== undefined) {
    const link = props as ButtonAsLink;
    return (
      <a
        href={link.href}
        id={link.id}
        target={link.target}
        rel={link.rel}
        className={cn(classes(variant, size, full), link.className)}
        onClick={link.onClick}
        aria-label={link['aria-label']}
      >
        {children}
        {iconRight}
      </a>
    );
  }

  const button = props as ButtonAsButton;
  return (
    <button
      type={button.type ?? 'button'}
      id={button.id}
      className={cn(classes(variant, size, full), button.className)}
      onClick={button.onClick}
      disabled={loading || button.disabled}
      aria-busy={loading || undefined}
      aria-label={button['aria-label']}
    >
      {loading ? <Spinner /> : null}
      {children}
      {!loading && iconRight}
    </button>
  );
}
