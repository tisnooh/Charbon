/**
 * Profil & paramètres — informations, préférences (thème, fuseau),
 * rappels, abonnement, sécurité, déconnexion, suppression de compte.
 * Chaque réglage applique un vrai PATCH /me (états pending + erreurs).
 */
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isValidTimeZone } from '@charbon/shared';
import { useLogout, useMe, useUpdateProfile } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, ConfirmDialog, Sheet, TextField, Toggle } from '../components/ui.js';
import {
  BellIcon,
  ChevronRightIcon,
  CrownIcon,
  LockIcon,
  LogoutIcon,
  SunIcon,
  UserIcon,
} from '../components/icons.js';
import { browserTimeZone } from '../lib/format.js';
import { applyTheme, readThemeChoice, writeThemeChoice, type ThemeChoice } from '../lib/theme.js';
import { useToast } from '../components/Toast.js';

const TIMEZONE_SUGGESTIONS = [
  'Europe/Paris',
  'Europe/Bruxelles',
  'Europe/Geneve',
  'Europe/Montreal',
  'America/Toronto',
  'America/New_York',
  'Africa/Abidjan',
  'Africa/Dakar',
  'Africa/Casablanca',
  'Africa/Algiers',
  'Indian/Antananarivo',
  'Indian/Reunion',
  'Pacific/Noumea',
  'Pacific/Tahiti',
  'UTC',
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const [theme, setTheme] = useState<ThemeChoice>(readThemeChoice());
  const [nameOpen, setNameOpen] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const user = me.data?.user;
  const plan = me.data?.plan ?? 'free';

  if (me.isPending || !user) {
    return (
      <div className="screen screen--with-tabbar">
        <div className="skeleton skeleton--row" style={{ height: 96, borderRadius: 20 }} />
        <div className="skeleton skeleton--row" style={{ marginTop: 16 }} />
      </div>
    );
  }

  function chooseTheme(next: ThemeChoice) {
    setTheme(next);
    writeThemeChoice(next);
    applyTheme(next);
  }

  async function patch(p: Parameters<typeof updateProfile.mutateAsync>[0], okMessage?: string) {
    try {
      await updateProfile.mutateAsync(p);
      if (okMessage) toast.push({ message: okMessage });
    } catch (err) {
      toast.push({ message: err instanceof ApiClientError ? err.message : 'Mise à jour impossible' });
    }
  }

  const detectedTz = browserTimeZone();
  const tzOptions = TIMEZONE_SUGGESTIONS.includes(detectedTz)
    ? TIMEZONE_SUGGESTIONS
    : [detectedTz, ...TIMEZONE_SUGGESTIONS];

  return (
    <div className="screen screen--with-tabbar">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1 className="h-title">Profil</h1>
        </div>
      </header>

      {/* Carte identité */}
      <div className="card row" style={{ gap: 16, marginBottom: 'var(--space-5)' }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--ember), var(--ember-deep))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 26,
            fontWeight: 800,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="strong" style={{ fontSize: 'var(--text-lg)' }}>
              {user.name}
            </span>
            {plan === 'premium' && <span className="badge badge--premium">Premium</span>}
          </div>
          <div className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email}
          </div>
          <div className="xsmall faint">Membre depuis {new Date(user.createdAt).getFullYear()}</div>
        </div>
      </div>

      {/* Informations */}
      <section className="section">
        <h2 className="h-section" style={{ marginBottom: 'var(--space-3)' }}>
          Informations
        </h2>
        <div className="card card--flat stack stack--tight" style={{ padding: 0 }}>
          <SettingsRow icon={<UserIcon width={18} height={18} />} label="Nom" value={user.name} onClick={() => setNameOpen(true)} />
          <SettingsRow icon={<LockIcon width={18} height={18} />} label="E-mail" value={user.email} staticRow />
        </div>
      </section>

      {/* Préférences */}
      <section className="section">
        <h2 className="h-section" style={{ marginBottom: 'var(--space-3)' }}>
          Préférences
        </h2>
        <div className="card card--flat stack" style={{ padding: 'var(--space-4)' }}>
          <div className="field">
            <span className="field__label row" style={{ gap: 6 }}>
              <SunIcon width={14} height={14} /> Apparence
            </span>
            <div className="segmented" role="tablist" aria-label="Thème">
              {(['system', 'light', 'dark'] as ThemeChoice[]).map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={theme === t}
                  className={`segmented__option ${theme === t ? 'segmented__option--active' : ''}`}
                  onClick={() => chooseTheme(t)}
                >
                  {t === 'system' ? 'Système' : t === 'light' ? 'Clair' : 'Sombre'}
                </button>
              ))}
            </div>
          </div>
          <SettingsRow
            icon={<span aria-hidden="true">🌍</span>}
            label="Fuseau horaire"
            value={user.timezone}
            onClick={() => setTzOpen(true)}
          />
        </div>
      </section>

      {/* Rappels */}
      <section className="section">
        <h2 className="h-section" style={{ marginBottom: 'var(--space-3)' }}>
          Rappels
        </h2>
        <div className="card card--flat stack" style={{ padding: 'var(--space-4)' }}>
          <div className="row row--between">
            <div className="row" style={{ gap: 10 }}>
              <BellIcon width={18} height={18} style={{ color: 'var(--ember)' }} />
              <div>
                <div className="strong small">Rappel quotidien</div>
                <div className="xsmall faint">Point du jour dans l’application</div>
              </div>
            </div>
            <Toggle
              checked={user.remindersEnabled}
              label="Activer le rappel quotidien"
              disabled={updateProfile.isPending}
              onChange={(v) => void patch({ remindersEnabled: v }, v ? 'Rappel activé' : 'Rappel désactivé')}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="reminder-time">
              Heure du rappel (votre fuseau : {user.timezone})
            </label>
            <input
              className="field__input"
              id="reminder-time"
              type="time"
              value={user.dailyReminderTime}
              disabled={!user.remindersEnabled || updateProfile.isPending}
              onChange={(e) => {
                const v = e.target.value;
                if (/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) void patch({ dailyReminderTime: v });
              }}
            />
            <p className="xsmall faint">
              Les notifications push natives (APNs/FCM) arriveront dans une version ultérieure ;
              le rappel s’affiche dans l’application (centre de notifications).
            </p>
          </div>
        </div>
      </section>

      {/* Compte */}
      <section className="section">
        <h2 className="h-section" style={{ marginBottom: 'var(--space-3)' }}>
          Compte
        </h2>
        <div className="card card--flat stack stack--tight" style={{ padding: 0 }}>
          <Link to="/profile/subscription" style={{ color: 'inherit' }}>
            <SettingsRow
              icon={<CrownIcon width={18} height={18} style={{ color: 'var(--amber)' }} />}
              label="Abonnement"
              value={plan === 'premium' ? 'Premium actif' : 'Free'}
            />
          </Link>
          <Link to="/profile/security" style={{ color: 'inherit' }}>
            <SettingsRow
              icon={<LockIcon width={18} height={18} />}
              label="Sécurité"
              value="Mot de passe, suppression"
            />
          </Link>
        </div>
      </section>

      <section className="section stack">
        <Button variant="secondary" block onClick={() => setConfirmLogout(true)}>
          <LogoutIcon width={16} height={16} /> Se déconnecter
        </Button>
        <p className="xsmall faint center">
          Charbon v0.1.0 · <Link to="/profile/security">Supprimer mon compte</Link>
        </p>
      </section>

      {/* Sheet : nom */}
      <NameSheet open={nameOpen} currentName={user.name} onClose={() => setNameOpen(false)} />

      {/* Sheet : fuseau */}
      <Sheet open={tzOpen} onClose={() => setTzOpen(false)} title="Fuseau horaire">
        <div className="stack">
          <p className="small muted">
            Utilisé pour déterminer « aujourd’hui », vos streaks et l’heure des rappels.
            Détection automatique : <strong>{detectedTz}</strong>.
          </p>
          <div className="row" style={{ gap: 8 }}>
            <Button
              variant="secondary"
              block
              disabled={!isValidTimeZone(detectedTz) || updateProfile.isPending}
              onClick={() => {
                void patch({ timezone: detectedTz }, 'Fuseau détecté appliqué');
                setTzOpen(false);
              }}
            >
              Utiliser {detectedTz}
            </Button>
          </div>
          <div className="stack stack--tight" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
            {tzOptions.map((tz) => (
              <button
                key={tz}
                type="button"
                className="list-row"
                style={{ width: '100%' }}
                disabled={updateProfile.isPending}
                onClick={() => {
                  void patch({ timezone: tz }, 'Fuseau mis à jour');
                  setTzOpen(false);
                }}
              >
                <span className="list-row__main">
                  <span className="list-row__title">{tz}</span>
                </span>
                {user.timezone === tz && <span className="badge badge--ember">actuel</span>}
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmLogout}
        title="Se déconnecter ?"
        body="Vous devrez vous reconnecter pour retrouver votre journée. Vos données restent sur le serveur."
        confirmLabel="Se déconnecter"
        pending={logout.isPending}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          logout.mutate(undefined, {
            onSettled: () => {
              setConfirmLogout(false);
              navigate('/login', { replace: true });
            },
          });
        }}
      />
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onClick,
  staticRow = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  staticRow?: boolean;
}) {
  const content = (
    <>
      <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }} aria-hidden="true">
        {icon}
      </span>
      <span className="list-row__main" style={{ minWidth: 0 }}>
        <span className="list-row__title" style={{ display: 'block', fontWeight: 500 }}>
          {label}
        </span>
        <span className="list-row__sub" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </span>
      </span>
      {!staticRow && <ChevronRightIcon width={16} height={16} className="faint" />}
    </>
  );
  if (staticRow || !onClick) {
    return <div className="list-row">{content}</div>;
  }
  return (
    <button type="button" className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={onClick}>
      {content}
    </button>
  );
}

function NameSheet({
  open,
  currentName,
  onClose,
}: {
  open: boolean;
  currentName: string;
  onClose: () => void;
}) {
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const key = open ? 'open' : 'closed';
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setName(currentName);
      setError(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Votre nom">
      <div className="stack">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <TextField
          label="Nom affiché"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button
            block
            pending={updateProfile.isPending}
            disabled={name.trim().length === 0 || name.trim() === currentName}
            onClick={() =>
              updateProfile.mutate(
                { name: name.trim() },
                {
                  onSuccess: () => {
                    toast.push({ message: 'Nom mis à jour' });
                    onClose();
                  },
                  onError: (err) =>
                    setError(err instanceof ApiClientError ? err.message : 'Mise à jour impossible'),
                },
              )
            }
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
