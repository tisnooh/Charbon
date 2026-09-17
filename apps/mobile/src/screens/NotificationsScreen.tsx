/**
 * Notifications in-app — liste réelle (rappels quotidiens créés par le
 * serveur), marquage lu / tout lire.
 */
import { useNavigate } from 'react-router-dom';
import { useNotificationMutations, useNotifications } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, EmptyState, ErrorState, SkeletonRows } from '../components/ui.js';
import { BellIcon, ChevronLeftIcon } from '../components/icons.js';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs)) return '';
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function NotificationsScreen() {
  const navigate = useNavigate();
  const notifs = useNotifications();
  const muts = useNotificationMutations();

  return (
    <div className="screen">
      <header className="screen-header">
        <button className="btn btn--icon btn--sm" style={{ width: 44, height: 44, minHeight: 44 }} onClick={() => navigate(-1)} aria-label="Retour">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <div className="screen-header__title" style={{ alignItems: 'center' }}>
          <h1 className="h-section">Notifications</h1>
        </div>
        {notifs.data && notifs.data.unread > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => muts.markAllRead.mutate()} pending={muts.markAllRead.isPending}>
            Tout lire
          </Button>
        ) : (
          <span style={{ width: 44 }} />
        )}
      </header>

      {notifs.isPending ? (
        <SkeletonRows count={3} />
      ) : notifs.isError ? (
        <ErrorState
          message={notifs.error instanceof ApiClientError ? notifs.error.message : 'Chargement impossible'}
          onRetry={() => void notifs.refetch()}
        />
      ) : notifs.data.items.length === 0 ? (
        <EmptyState
          icon="🔕"
          title="Aucune notification"
          body="Activez le rappel quotidien dans Profil → Rappels pour recevoir votre point du soir."
          action={
            <Button size="sm" onClick={() => navigate('/profile')}>
              Ouvrir les réglages
            </Button>
          }
        />
      ) : (
        <div className="stack stack--tight">
          {notifs.data.items.map((n) => (
            <button
              key={n.id}
              type="button"
              className="list-row"
              style={{ width: '100%', textAlign: 'left', opacity: n.readAt ? 0.65 : 1 }}
              onClick={() => {
                if (!n.readAt) muts.markRead.mutate(n.id);
              }}
              aria-label={`${n.readAt ? '' : 'Non lu : '}${n.title}`}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <BellIcon width={16} height={16} style={{ color: n.readAt ? 'var(--text-faint)' : 'var(--ember)' }} />
              </span>
              <span className="list-row__main">
                <span className="list-row__title" style={{ display: 'block' }}>
                  {n.title} {!n.readAt && <span className="badge badge--ember">nouveau</span>}
                </span>
                {n.body && <span className="list-row__sub" style={{ display: 'block', whiteSpace: 'normal' }}>{n.body}</span>}
                <span className="xsmall faint">{timeAgo(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
