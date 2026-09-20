import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils/cn';

interface SectionHeadingProps {
  label?: string;
  title: string | string[];
  /** Contenu additionnel (sous-titre, paragraphes…). */
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  as?: 'h1' | 'h2';
}

/** En-tête de section standard : label numéroté + titre éditorial + reveal. */
export function SectionHeading({
  label,
  title,
  children,
  className,
  titleClassName,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  return (
    <div className={className}>
      {label ? (
        <Reveal>
          <p className="eyebrow">{label}</p>
        </Reveal>
      ) : null}
      <Reveal delay={90}>
        <Tag className={cn('mt-5 text-display-lg text-ink-100', titleClassName)}>{renderLines(title)}</Tag>
      </Reveal>
      {children ? (
        <Reveal delay={180}>
          <div className="mt-6">{children}</div>
        </Reveal>
      ) : null}
    </div>
  );
}

function renderLines(title: string | string[]) {
  if (typeof title === 'string') return title;
  return title.map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}
