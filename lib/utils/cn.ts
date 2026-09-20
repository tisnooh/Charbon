/** Concatène des classes conditionnelles sans dépendance externe. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Classes de conteneur partagées par toutes les sections. */
export const container = 'mx-auto w-full max-w-container px-5 sm:px-8 lg:px-12';

/** Padding vertical standard d'une section. */
export const sectionPad = 'py-24 md:py-32 lg:py-40';
