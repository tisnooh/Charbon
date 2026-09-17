/**
 * Statistiques — aujourd'hui / 7 j / 30 j (Free), 90 j / 365 j (Premium).
 * Le gating est appliqué côté SERVEUR ; l'UI affiche l'upsell honnêtement
 * quand l'API répond 403 premium_required.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { StatsRange } from '@charbon/shared';
import { useMe, useStats } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, ErrorState, SegmentedControl, SkeletonRows } from '../components/ui.js';
import { formatPct, formatShortDate, weekdayShort } from '../lib/format.js';

const FREE_RANGES: Array<{ value: StatsRange; label: string }> = [
  { value: 'today', label: 'Auj.' },
  { value: '7d', label: '7 j' },
  { value: '30d', label: '30 j' },
];

const PREMIUM_RANGES: Array<{ value: StatsRange; label: string }> = [
  { value: '90d', label: '90 j' },
  { value: '365d', label: '365 j' },
];

export function StatsScreen() {
  const me = useMe();
  const plan = me.data?.plan ?? 'free';
  const [range, setRange] = useState<StatsRange>('7d');
  const stats = useStats(range);

  const allOptions = plan === 'premium' ? [...FREE_RANGES, ...PREMIUM_RANGES] : FREE_RANGES;

  const premiumDenied =
    stats.isError &&
    stats.error instanceof ApiClientError &&
    stats.error.code === 'premium_required';

  return (
    <div className="screen">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1 className="h-title">Statistiques</h1>
          <span className="xsmall muted">Ce qui se mesure s’améliore.</span>
        </div>
      </header>

      <div style={{ marginBottom: 'var(--space-4)' }} className="stack stack--tight">
        <SegmentedControl
          ariaLabel="Période de statistiques"
          options={allOptions}
          value={range}
          onChange={setRange}
        />
        {plan === 'free' && (
          <div className="row" style={{ gap: 8 }}>
            {PREMIUM_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                className="chip"
                onClick={() => setRange(r.value)}
                aria-pressed={range === r.value}
              >
                {r.label} 🔒
              </button>
            ))}
            <span className="xsmall faint">Premium</span>
          </div>
        )}
      </div>

      {premiumDenied && (
        <div className="card center stack" style={{ marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: 30 }} aria-hidden="true">🔒</span>
          <h2 className="h-section">Statistiques avancées</h2>
          <p className="small muted">
            Les analyses {range === '90d' ? '90 jours' : '365 jours'} font partie du plan Premium.
            Le cœur de Charbon (habitudes, routines, tâches, objectifs, stats 30 jours) reste
            gratuit.
          </p>
          <Link to="/profile/subscription">
            <Button block>Voir Premium</Button>
          </Link>
          <Button variant="ghost" onClick={() => setRange('30d')}>
            Retour aux 30 derniers jours
          </Button>
        </div>
      )}

      {!premiumDenied && stats.isPending && <SkeletonRows count={3} />}

      {!premiumDenied && stats.isError && (
        <ErrorState
          message={stats.error instanceof ApiClientError ? stats.error.message : 'Statistiques indisponibles'}
          onRetry={() => void stats.refetch()}
        />
      )}

      {!premiumDenied && stats.data && (
        <>
          <div className="stat-grid" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="stat-cell">
              <div className="stat-cell__value" style={{ color: 'var(--ember)' }}>
                {formatPct(stats.data.totals.rate)}
              </div>
              <div className="stat-cell__label">taux de réalisation</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell__value">{stats.data.totals.completed}</div>
              <div className="stat-cell__label">actions terminées</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell__value">{stats.data.totals.expected}</div>
              <div className="stat-cell__label">actions prévues</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="row row--between" style={{ marginBottom: 'var(--space-3)' }}>
              <h2 className="h-section">Régularité</h2>
              <span className={`badge ${stats.data.trendPoints >= 0 ? 'badge--success' : ''}`}>
                {stats.data.trendPoints >= 0 ? '▲' : '▼'} {Math.abs(stats.data.trendPoints).toFixed(1)} pts
              </span>
            </div>
            <BarChart days={stats.data.days} />
            <div className="row row--between xsmall faint" style={{ marginTop: 8 }}>
              <span>{stats.data.days.length > 0 ? formatShortDate(stats.data.days[0]!.date) : ''}</span>
              <span>
                {stats.data.days.length > 0
                  ? formatShortDate(stats.data.days[stats.data.days.length - 1]!.date)
                  : ''}
              </span>
            </div>
            <p className="xsmall faint" style={{ marginTop: 8 }}>
              Évolution : moyenne de la 2ᵉ moitié de période contre la 1ʳᵉ (en points de taux).
            </p>
          </div>

          <div className="stat-grid">
            <div className="stat-cell">
              <div className="stat-cell__value">🔥 {stats.data.streak.current}</div>
              <div className="stat-cell__label">jours parfaits d’affilée</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell__value">{stats.data.streak.longest}</div>
              <div className="stat-cell__label">record (365 j)</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell__value">
                {stats.data.days.filter((d) => d.expected > 0 && d.rate === 1).length}
              </div>
              <div className="stat-cell__label">jours parfaits</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Graphique en barres pur CSS (aucune lib externe) — une barre par jour. */
function BarChart({ days }: { days: Array<{ date: string; rate: number; expected: number }> }) {
  if (days.length === 0) return null;
  // Pour les longues périodes, on agrège par semaine pour rester lisible.
  const buckets =
    days.length > 40
      ? chunkAverage(days, Math.ceil(days.length / 20))
      : days.map((d) => ({ label: weekdayShort(d.date).replace('.', ''), rate: d.rate, expected: d.expected, date: d.date }));
  return (
    <div className="barchart" role="img" aria-label="Taux de réalisation par jour">
      {buckets.map((b, i) => (
        <div className="barchart__col" key={`${b.date}-${i}`} title={`${b.date} — ${Math.round(b.rate * 100)} %`}>
          <div
            className={`barchart__bar ${b.expected === 0 ? 'barchart__bar--empty' : ''}`}
            style={{ height: `${Math.max(2, b.rate * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function chunkAverage(
  days: Array<{ date: string; rate: number; expected: number }>,
  size: number,
): Array<{ label: string; rate: number; expected: number; date: string }> {
  const out: Array<{ label: string; rate: number; expected: number; date: string }> = [];
  for (let i = 0; i < days.length; i += size) {
    const slice = days.slice(i, i + size);
    const withExpected = slice.filter((d) => d.expected > 0);
    const rate = withExpected.length === 0 ? 0 : withExpected.reduce((s, d) => s + d.rate, 0) / withExpected.length;
    out.push({
      label: '',
      rate,
      expected: slice.reduce((s, d) => s + d.expected, 0),
      date: slice[slice.length - 1]?.date ?? '',
    });
  }
  return out;
}
