/**
 * Abonnement — état RÉEL du plan, comparaison Free/Premium issue de
 * @charbon/shared (source de vérité unique avec le site), upgrade :
 * - mode développement (DEV_BILLING) : simulateur explicitement labelisé ;
 * - sinon : état honnête « paiement non configuré sur ce serveur » (501).
 * Aucun faux achat, aucun paywall artificiel sur les fonctions essentielles.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '@charbon/shared';
import { useSubscription, useSubscriptionMutations } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, ConfirmDialog, ErrorState, SkeletonRows } from '../components/ui.js';
import { CheckIcon, ChevronLeftIcon, CrownIcon } from '../components/icons.js';
import { formatPrice } from '../lib/format.js';
import { useToast } from '../components/Toast.js';

export function SubscriptionScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const sub = useSubscription();
  const muts = useSubscriptionMutations();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (sub.isPending) {
    return (
      <div className="screen">
        <SkeletonRows count={3} />
      </div>
    );
  }

  if (sub.isError || !sub.data) {
    return (
      <div className="screen">
        <ErrorState
          message={sub.error instanceof ApiClientError ? sub.error.message : 'Abonnement indisponible'}
          onRetry={() => void sub.refetch()}
        />
      </div>
    );
  }

  const s = sub.data;
  const isPremium = s.plan === 'premium' && s.status === 'active';

  function onUpgrade() {
    muts.upgrade.mutate(undefined, {
      onSuccess: () => toast.push({ message: 'Premium activé (mode développement) 🔓' }),
      onError: (err) => {
        if (err instanceof ApiClientError && err.code === 'payment_provider_not_configured') {
          toast.push({ message: err.message, durationMs: 6000 });
        } else {
          toast.push({ message: err instanceof ApiClientError ? err.message : 'Activation impossible' });
        }
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
          <h1 className="h-section">Abonnement</h1>
        </div>
        <span style={{ width: 44 }} />
      </header>

      {/* État actuel — toujours vrai */}
      <div className="card center" style={{ marginBottom: 'var(--space-5)' }}>
        <CrownIcon width={28} height={28} style={{ color: isPremium ? 'var(--amber)' : 'var(--text-faint)' }} />
        <h2 className="h-section" style={{ marginTop: 8 }}>
          Plan {isPremium ? 'Premium' : 'Free'} — actif
        </h2>
        <p className="small muted">
          {isPremium
            ? s.provider === 'dev'
              ? 'Activé via le simulateur de développement (aucun paiement réel).'
              : 'Merci de soutenir Charbon.'
            : 'Vous utilisez le cœur complet de Charbon, gratuitement.'}
        </p>
        {isPremium && (
          <Button variant="secondary" style={{ marginTop: 12 }} onClick={() => setConfirmCancel(true)}>
            Revenir au plan Free
          </Button>
        )}
      </div>

      {/* Comparatif — généré depuis les constantes partagées (mêmes données que le site) */}
      <div className="stack">
        {(['free', 'premium'] as const).map((planId) => {
          const plan = PLANS[planId];
          const current = (planId === 'premium') === isPremium;
          return (
            <div
              key={planId}
              className="card"
              style={planId === 'premium' ? { borderColor: 'rgba(245,158,11,0.45)' } : undefined}
            >
              <div className="row row--between" style={{ marginBottom: 10 }}>
                <div>
                  <div className="strong" style={{ fontSize: 'var(--text-lg)' }}>
                    {plan.name} {planId === 'premium' && <span className="badge badge--premium">Premium</span>}
                  </div>
                  <div className="xsmall muted">{plan.tagline}</div>
                </div>
                <div className="strong" style={{ fontSize: 'var(--text-lg)' }}>
                  {formatPrice(plan.priceMonthly.amount)}
                  {plan.priceMonthly.amount > 0 && <span className="xsmall faint">/mois</span>}
                </div>
              </div>
              <ul className="stack stack--tight" style={{ listStyle: 'none' }}>
                {plan.features.map((f) => (
                  <li key={f} className="row small" style={{ gap: 8 }}>
                    <CheckIcon width={14} height={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
                {plan.upcoming.map((f) => (
                  <li key={f} className="row small faint" style={{ gap: 8 }}>
                    <span style={{ flexShrink: 0 }} aria-hidden="true">⏳</span>
                    {f} — à venir
                  </li>
                ))}
              </ul>
              {current ? (
                <div className="badge badge--success" style={{ marginTop: 12 }}>
                  Votre plan actuel
                </div>
              ) : planId === 'premium' ? (
                <div className="stack stack--tight" style={{ marginTop: 12 }}>
                  <Button block pending={muts.upgrade.isPending} onClick={onUpgrade}>
                    Passer Premium
                  </Button>
                  {s.billingDevMode && (
                    <p className="xsmall faint center">
                      Mode développement : activation simulée, sans paiement réel.
                    </p>
                  )}
                  {!s.billingDevMode && !s.paymentConfigured && (
                    <p className="xsmall faint center" role="status">
                      Le paiement en ligne n’est pas encore disponible sur ce serveur. Rien ne vous
                      sera débité ; réessayez plus tard.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="xsmall faint center" style={{ marginTop: 'var(--space-5)' }}>
        Politique : pas de paywall artificiel. Habitudes, routines, tâches, objectifs et
        statistiques 30 jours restent gratuits pour toujours.
      </p>

      <ConfirmDialog
        open={confirmCancel}
        title="Revenir au plan Free ?"
        body="Vous perdrez l’accès aux statistiques 90/365 jours et à l’historique approfondi. Le cœur de Charbon reste entièrement utilisable."
        confirmLabel="Revenir à Free"
        pending={muts.cancel.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() =>
          muts.cancel.mutate(undefined, {
            onSuccess: () => {
              setConfirmCancel(false);
              toast.push({ message: 'Vous êtes de retour sur le plan Free' });
            },
            onError: (err) => {
              setConfirmCancel(false);
              toast.push({ message: err instanceof ApiClientError ? err.message : 'Résiliation impossible' });
            },
          })
        }
      />
    </div>
  );
}
