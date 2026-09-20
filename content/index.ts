/**
 * Point d'accès unique au contenu du site.
 * Locale par défaut : FR. Pour activer EN plus tard, voir README ("Ajouter EN").
 */
import { fr } from './fr';
import { en } from './en';
import type { Content } from '@/types/content';

export const copy: Content = fr;

export const locales = { fr, en } satisfies Record<'fr' | 'en', Content>;
