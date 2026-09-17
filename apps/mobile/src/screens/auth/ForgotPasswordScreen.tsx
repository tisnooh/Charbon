import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '@charbon/shared';
import { useForgotPassword } from '../../api/hooks.js';
import { ApiClientError } from '../../api/client.js';
import { Button, TextField } from '../../components/ui.js';
import { ChevronLeftIcon } from '../../components/icons.js';

export function ForgotPasswordScreen() {
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'E-mail invalide');
      return;
    }
    try {
      const res = await forgot.mutateAsync(parsed.data.email);
      setSentMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Envoi impossible. Réessayez.');
    }
  }

  return (
    <div className="auth-screen">
      <div>
        <Link to="/login" className="row small" aria-label="Retour à la connexion">
          <ChevronLeftIcon width={16} height={16} /> Retour
        </Link>
      </div>
      <div>
        <h1 className="h-title">Mot de passe oublié</h1>
        <p className="small muted" style={{ marginTop: 'var(--space-2)' }}>
          Entrez votre e-mail : si un compte existe, nous vous envoyons un lien de
          réinitialisation (valide 30 minutes).
        </p>
      </div>

      {sentMessage ? (
        <div className="stack">
          <div className="form-success" role="status">
            {sentMessage}
          </div>
          <Link to="/login">
            <Button variant="secondary" block>
              Retour à la connexion
            </Button>
          </Link>
        </div>
      ) : (
        <form className="stack" onSubmit={onSubmit} noValidate>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <TextField
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" block pending={forgot.isPending}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </div>
  );
}
