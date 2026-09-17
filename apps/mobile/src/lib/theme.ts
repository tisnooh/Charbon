/**
 * Thème : système (par défaut) / clair / sombre.
 * Persisté dans localStorage, appliqué via data-theme sur <html>.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'charbon:theme';

export function readThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // stockage indisponible (mode privé strict) → défaut système
  }
  return 'system';
}

export function writeThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // ignoré : le thème reste appliqué pour la session
  }
}

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', choice);
  }
  // theme-color navigateur/PWA cohérent.
  const prefersDark =
    choice === 'dark' ||
    (choice === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const media = meta.getAttribute('media');
    if (!media) continue;
    meta.content = prefersDark ? '#0C0D10' : '#F6F6F8';
  }
}
