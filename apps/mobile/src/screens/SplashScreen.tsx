import { CharbonMark } from '../components/icons.js';

/** Écran de démarrage : session en cours de résolution. */
export function SplashScreen() {
  return (
    <div className="auth-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-logo">
        <CharbonMark size={72} />
        <h1 className="h-title">Charbon</h1>
      </div>
      <div className="skeleton skeleton--title" style={{ margin: '0 auto' }} />
      <p className="small faint" aria-live="polite">
        Chargement de votre session…
      </p>
    </div>
  );
}
