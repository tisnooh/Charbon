import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// En production, l'API sert l'application sous /app/ (même origine que le site) ;
// en développement, Vite la sert à la racine de :5173.
const basename = import.meta.env.PROD ? '/app' : '/';
import { App } from './App.js';
import { ToastProvider } from './components/Toast.js';
import { SessionBootstrap } from './state/session.js';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
      refetchOnWindowFocus: true,
    },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Élément #root introuvable');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessionBootstrap>
          <BrowserRouter basename={basename}>
            <App />
          </BrowserRouter>
        </SessionBootstrap>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);

// Service worker (PWA) — enregistré en production uniquement pour éviter
// toute interférence avec le hot-reload Vite en développement.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[pwa] enregistrement du service worker échoué :', err);
    });
  });
}
