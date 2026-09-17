import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '@charbon/shared';
import { useLogin, useMe } from '../../api/hooks.js';
import { ApiClientError } from '../../api/client.js';
import { Button, TextField } from '../../components/ui.js';
import { CharbonMark } from '../../components/icons.js';

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const me = useMe();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (me.data) return <Navigate to="/" replace />;

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email') errs.email = issue.message;
        if (key === 'password') errs.password = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    try {
      await login.mutateAsync(parsed.data);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Connexion impossible. Réessayez.');
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="auth-logo__mark">
          <CharbonMark size={40} />
        </div>
        <h1 className="h-title">Charbon</h1>
        <p className="small muted">La constance s’entretient comme un feu.</p>
      </div>

      <form className="stack" onSubmit={onSubmit} noValidate>
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        <TextField
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <Button type="submit" block pending={login.isPending}>
          Se connecter
        </Button>
        <div className="row row--between small">
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
          <Link to="/register">Créer un compte</Link>
        </div>
      </form>
    </div>
  );
}
