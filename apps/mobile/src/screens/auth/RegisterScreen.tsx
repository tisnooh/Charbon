import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registerSchema } from '@charbon/shared';
import { useMe, useRegister } from '../../api/hooks.js';
import { ApiClientError } from '../../api/client.js';
import { Button, TextField } from '../../components/ui.js';
import { CharbonMark } from '../../components/icons.js';
import { browserTimeZone } from '../../lib/format.js';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export function RegisterScreen() {
  const navigate = useNavigate();
  const register = useRegister();
  const me = useMe();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (me.data) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (password !== confirm) {
      setFieldErrors({ confirm: 'Les mots de passe ne correspondent pas' });
      return;
    }

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      timezone: browserTimeZone(),
    });
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'name') errs.name = issue.message;
        if (key === 'email') errs.email = issue.message;
        if (key === 'password') errs.password = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    try {
      await register.mutateAsync(parsed.data);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'email_taken') {
        setFieldErrors({ email: 'Un compte existe déjà avec cet e-mail' });
        return;
      }
      setFormError(err instanceof ApiClientError ? err.message : 'Inscription impossible. Réessayez.');
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="auth-logo__mark">
          <CharbonMark size={40} />        </div>
        <h1 className="h-title">Créer votre compte</h1>
        <p className="small muted">Gratuit, sans engagement. Vos données vous appartiennent.</p>
      </div>

      <form className="stack" onSubmit={onSubmit} noValidate>
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        <TextField
          label="Prénom / pseudo"
          autoComplete="nickname"
          placeholder="Comment vous appelez-vous ?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
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
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <TextField
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />
        <Button type="submit" block pending={register.isPending}>
          Commencer
        </Button>
        <p className="small center muted">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
