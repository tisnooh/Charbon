import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Description accessible du mockup (l'écran est décoratif pour les lecteurs d'écran). */
  label?: string;
}

/**
 * Châssis iPhone premium — finition titane sobre, écran noir profond.
 * L'écran interne est un conteneur (container-type) : tout le contenu
 * des mockups est dimensionné en cqw, donc parfaitement proportionnel
 * quelle que soit la largeur rendue (320 px → 1920 px).
 */
export function PhoneFrame({ children, className, label = 'Aperçu de l’application Charbon' }: PhoneFrameProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative rounded-phone bg-gradient-to-b from-[#3C3C3A] via-[#0D0D0C] to-[#30302E] p-[2.5px]',
        'shadow-[0_60px_120px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.05)]',
        className,
      )}
    >
      {/* Boutons latéraux */}
      <span aria-hidden className="absolute -left-[3px] top-[17%] h-[3.5%] w-[3px] rounded-l-sm bg-[#26262A]" />
      <span aria-hidden className="absolute -left-[3px] top-[24%] h-[6%] w-[3px] rounded-l-sm bg-[#26262A]" />
      <span aria-hidden className="absolute -left-[3px] top-[32%] h-[6%] w-[3px] rounded-l-sm bg-[#26262A]" />
      <span aria-hidden className="absolute -right-[3px] top-[27%] h-[9%] w-[3px] rounded-r-sm bg-[#26262A]" />

      <div className="rounded-[calc(3.25rem-2.5px)] bg-coal-950 p-[5px]">
        <div className="relative aspect-[560/1216] overflow-hidden rounded-screen bg-black [container-type:inline-size]">
          {children}
        </div>
      </div>
    </div>
  );
}
