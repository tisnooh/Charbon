import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// l'environnement de test n'implémente pas forcément matchMedia — nécessaire pour la détection dark mode.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// l'environnement de test n'implémente pas forcément scrollIntoView (utilisé par les bottom sheets).
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// l'environnement DOM de test ne suit pas les navigations ; les stubs évitent du bruit dans les tests.
if (typeof window !== 'undefined') {
  vi.stubGlobal('scrollTo', () => {});
}
