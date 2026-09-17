import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema } from '@charbon/shared';
import { useResetPassword } from '../../api/hooks.js';
import { ApiClientError } from '../../api/client.js';
import { Button, TextField } from '../../components/ui.js';

export function ResetPasswordScreen() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const reset = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="auth-screen">
        <div className="form-error" role="alert">
          Lien de réinitialisation incomplet : aucun jeton fourni. Demandez un nouveau lien.
        </div>
        <Link to="/forgot-password">
          <Button block>Demander un nouveau lien</Button>
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
      return;
    }
    try {
      await reset.mutateAsync(parsed.data);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Réinitialisation impossible.');
    }
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="form-success" role="status">
          Mot de passe mis à jour. Toutes les sessions actives ont été déconnectées par sécurité.
        </div>
        <Link to="/login">
          <Button block>Se connecter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div>
        <h1 className="h-title">Nouveau mot de passe</h1>
        <p className="small muted" style={{ marginTop: 'var(--space-2)' }}>
          Choisissez un mot de passe d’au moins 8 caractères.
        </p>
      </div>
      <form className="stack" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <TextField
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirmer"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" block pending={reset.isPending}>
          Réinitialiser
        </Button>
      </form>
    </div>
  );
}
