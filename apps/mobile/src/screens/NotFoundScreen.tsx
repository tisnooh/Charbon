import { Link } from 'react-router-dom';
import { Button } from '../components/ui.js';

export function NotFoundScreen() {
  return (
    <div className="auth-screen" style={{ textAlign: 'center' }}>
      <div>
        <div className="h-display" aria-hidden="true">
          404
        </div>
        <h1 className="h-title">Page introuvable</h1>
        <p className="small muted" style={{ marginTop: 8 }}>
          Ce chemin n’existe pas dans l’application Charbon.
        </p>
      </div>
      <Link to="/">
        <Button block>Retour à l’accueil</Button>
      </Link>
    </div>
  );
}
