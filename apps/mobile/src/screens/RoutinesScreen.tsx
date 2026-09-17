/**
 * Routines — routines du jour (progression) + toutes les routines.
 * Une routine = suite d'actions cochables ; l'exécution se fait sur
 * l'écran de détail (/routines/:id).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RoutineDTO } from '@charbon/shared';
import { useRoutines, useRoutinesToday } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, EmptyState, ErrorState, ProgressBar, SkeletonRows } from '../components/ui.js';
import { ChevronRightIcon, PlusIcon } from '../components/icons.js';
import { scheduleLabel, timeOfDayLabel } from '../lib/format.js';
import { RoutineSheet } from './routines/RoutineSheet.js';

export function RoutinesScreen() {
  const navigate = useNavigate();
  const routines = useRoutines();
  const routinesToday = useRoutinesToday();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RoutineDTO | null>(null);

  const todayItems = routinesToday.data?.items ?? [];
  const scheduledToday = todayItems.filter((r) => r.scheduledToday);

  return (
    <div className="screen screen--with-tabbar">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1 className="h-title">Routines</h1>
          <span className="xsmall muted">Des séquences qui se déroulent toutes seules.</span>
        </div>
      </header>

      {routinesToday.isPending && routines.isPending ? (
        <SkeletonRows count={3} />
      ) : routines.isError ? (
        <ErrorState
          message={routines.error instanceof ApiClientError ? routines.error.message : 'Chargement impossible'}
          onRetry={() => {
            void routines.refetch();
            void routinesToday.refetch();
          }}
        />
      ) : (
        <>
          {scheduledToday.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>Aujourd’hui</h2>
              </div>
              <div className="stack stack--tight">
                {scheduledToday.map((r) => (
                  <div
                    className="list-row"
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/routines/${r.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/routines/${r.id}`);
                      }
                    }}
                  >
                    <div className="list-row__main">
                      <div className="list-row__title">
                        {r.name} {r.doneToday && <span className="badge badge--success">terminée</span>}
                      </div>
                      <div style={{ margin: '6px 0' }}>
                        <ProgressBar pct={r.itemsTotal === 0 ? 0 : r.itemsDoneToday / r.itemsTotal} />
                      </div>
                      <div className="list-row__sub">
                        {r.itemsDoneToday}/{r.itemsTotal} actions
                        {r.scheduledTime ? ` · ${r.scheduledTime}` : ''}
                      </div>
                    </div>
                    <ChevronRightIcon width={18} height={18} className="faint" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <div className="section-head">
              <h2>Toutes les routines</h2>
            </div>
            {(routines.data?.items ?? []).length === 0 ? (
              <EmptyState
                icon="🧭"
                title="Aucune routine"
                body="Matin, soir, sport, travail : enchaînez quelques actions décisives sans y repenser."
                action={<Button onClick={() => setSheetOpen(true)}>Créer une routine</Button>}
              />
            ) : (
              <div className="stack stack--tight">
                {(routines.data?.items ?? []).map((r) => (
                  <div className="list-row" key={r.id}>
                    <div
                      className="list-row__main"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/routines/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/routines/${r.id}`);
                        }
                      }}
                    >
                      <div className="list-row__title">{r.name}</div>
                      <div className="list-row__sub">
                        {timeOfDayLabel(r.timeOfDay)} · {r.items.length} action
                        {r.items.length > 1 ? 's' : ''} · {scheduleLabel(r.schedule)}
                        {r.scheduledTime ? ` · ${r.scheduledTime}` : ''}
                      </div>
                    </div>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        setEditing(r);
                        setSheetOpen(true);
                      }}
                      aria-label={`Modifier « ${r.name} »`}
                    >
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <button
        className="fab"
        aria-label="Nouvelle routine"
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
      >
        <PlusIcon width={24} height={24} />
      </button>

      <RoutineSheet
        open={sheetOpen}
        routine={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
