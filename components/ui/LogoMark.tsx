import { cn } from '@/lib/utils/cn';

/**
 * Marque Charbon : l'étoile à quatre branches du favicon,
 * en plein, couleur courante.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={cn('h-4 w-4', className)}>
      <path
        d="M32 11c2.5 12.6 9.1 19.2 21.7 21.7C41.1 35.2 34.5 41.8 32 54.4 29.5 41.8 22.9 35.2 10.3 32.7 22.9 30.2 29.5 23.6 32 11z"
        fill="currentColor"
      />
    </svg>
  );
}
