/**
 * Sécurité — changement de mot de passe (révoque les autres sessions côté
 * serveur) et suppression définitive du compte (confirmation par mot de passe,
 * cascade complète).
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePasswordSchema, deleteAccountSchema } from '@charbon/shared';
import { useChangePassword, useDeleteAccount } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, TextField } from '../components/ui.js';
import { ChevronLeftIcon } from '../components/icons.js';
import { useToast } from '../components/Toast.js';

export function SecurityScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (password !== confirm) {
      setPwError('Les mots de passe ne correspondent pas');
      return;
    }
    const parsed = changePasswordSchema.safeParse({ currentPassword, password });
    if (!parsed.success) {
      setPwError(parsed.error.issues[0]?.message ?? 'Entrée invalide');
      return;
    }
    try {
      await changePassword.mutateAsync(parsed.data);
      setPwSuccess('Mot de passe mis à jour. Vos autres sessions ont été déconnectées.');
      setCurrentPassword('');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setPwError(err instanceof ApiClientError ? err.message : 'Changement impossible');
    }
  }

  function onDelete() {
    setDeleteError(null);
    const parsed = deleteAccountSchema.safeParse({ password: deletePassword });
    if (!parsed.success) {
      setDeleteError(parsed.error.issues[0]?.message ?? 'Mot de passe requis');
      return;
    }
    deleteAccount.mutate(parsed.data.password, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.push({ message: 'Compte supprimé définitivement' });
        navigate('/login', { replace: true });
      },
      onError: (err) => {
        setDeleteError(
          err instanceof ApiClientError ? err.message : 'Suppression impossible. Vérifiez votre mot de passe.',
        );
      },
    });
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <button className="btn btn--icon btn--sm" style={{ width: 44, height: 44, minHeight: 44 }} onClick={() => navigate(-1)} aria-label="Retour">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <div className="screen-header__title" style={{ alignItems: 'center' }}>
          <h1 className="h-section">Sécurité</h1>
        </div>
        <span style={{ width: 44 }} />
      </header>

      <section className="section">
        <h2 className="h-section" style={{ marginBottom: 'var(--space-3)' }}>
          Changer le mot de passe
        </h2>
        <form className="card stack" onSubmit={onChangePassword} noValidate>
          {pwError && (
            <div className="form-error" role="alert">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="form-success" role="status">
              {pwSuccess}
            </div>
          )}
          <TextField
            label="Mot de passe actuel"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirmer le nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button
            type="submit"
            block
            pending={changePassword.isPending}
            disabled={currentPassword.length === 0 || password.length === 0 || confirm.length === 0}
          >
            Mettre à jour
          </Button>
        </form>
      </section>

      <section className="section">
        <h2 className="h-section" style={{ marginBottom: 'var(--space-3)', color: 'var(--danger)' }}>
          Zone sensible
        </h2>
        <div className="card stack">
          <p className="small muted">
            La suppression est <strong>définitive</strong> : compte, objectifs, tâches, habitudes,
            routines, historiques et notifications sont effacés du serveur (cascade intégrale).
          </p>
          <Button variant="danger-outline" block onClick={() => setDeleteOpen(true)}>
            Supprimer mon compte
          </Button>
        </div>
      </section>

      {deleteOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setDeleteOpen(false)} aria-hidden="true" />
          <div className="dialog" role="alertdialog" aria-modal="true" aria-label="Supprimer le compte">
            <div className="dialog__title">Supprimer définitivement votre compte ?</div>
            <div className="dialog__body">
              Cette action est irréversible : toutes vos données seront effacées du serveur.
              Confirmez avec votre mot de passe.
            </div>
            <div className="stack">
              {deleteError && (
                <div className="form-error" role="alert">
                  {deleteError}
                </div>
              )}
              <TextField
                label="Votre mot de passe"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onDelete();
                }}
              />
              <div className="dialog__actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteError(null);
                  }}
                  disabled={deleteAccount.isPending}
                >
                  Annuler
                </Button>
                <Button variant="danger" onClick={onDelete} pending={deleteAccount.isPending} disabled={deletePassword.length === 0}>
                  Supprimer tout
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
