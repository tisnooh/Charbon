/**
 * Onboarding — 3 étapes guidées : objectifs, habitudes, routine.
 * Tout est réel : les sélections créent de vraies entités via POST /onboarding.
 * « Passer » marque simplement l'onboarding terminé (compte vide assumé).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, useUpdateProfile } from '../api/hooks.js';
import { ApiClientError } from '../api/client.js';
import { Button, TextField } from '../components/ui.js';
import { CharbonMark } from '../components/icons.js';

interface GoalTemplate {
  title: string;
  emoji: string;
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  { title: 'Être plus constant', emoji: '🔥' },
  { title: 'Me lever tôt', emoji: '🌅' },
  { title: 'Me remettre en forme', emoji: '💪' },
  { title: 'Lire davantage', emoji: '📚' },
  { title: 'Mieux manger', emoji: '🥗' },
  { title: 'Travailler en profondeur', emoji: '🎯' },
  { title: 'Réduire les écrans', emoji: '📵' },
];

interface HabitTemplate {
  name: string;
  emoji: string;
  color: string;
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  { name: 'Lire 10 minutes', emoji: '📖', color: '#F97316' },
  { name: 'Méditer', emoji: '🧘', color: '#8B5CF6' },
  { name: 'Boire 1,5 L d’eau', emoji: '💧', color: '#38BDF8' },
  { name: 'Bouger 30 minutes', emoji: '🏃', color: '#34D399' },
  { name: 'Écrire 3 gratitudes', emoji: '📝', color: '#F59E0B' },
  { name: 'Pas d’écran après 22 h', emoji: '🌙', color: '#A78BFA' },
];

interface RoutineTemplate {
  name: string;
  timeOfDay: 'morning' | 'evening' | 'custom';
  emoji: string;
  items: string[];
}

const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  { name: 'Routine matin', timeOfDay: 'morning', emoji: '🌅', items: ['Verre d’eau', 'Étirements', 'Pas de téléphone'] },
  { name: 'Routine soir', timeOfDay: 'evening', emoji: '🌙', items: ['Écrans éteints', 'Journal de la journée', 'Préparer demain'] },
  { name: 'Routine sport', timeOfDay: 'custom', emoji: '🏋️', items: ['Échauffement', 'Séance', 'Étirements'] },
  { name: 'Routine travail', timeOfDay: 'custom', emoji: '💼', items: ['Top 3 priorités', 'Bloc focus 50 min', 'Bilan'] },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [habits, setHabits] = useState<HabitTemplate[]>([]);
  const [customHabit, setCustomHabit] = useState('');
  const [routines, setRoutineTemplates] = useState<RoutineTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);

  const steps = ['Objectifs', 'Habitudes', 'Routine'];

  async function finish(skip: boolean) {
    setError(null);
    try {
      if (skip) {
        await updateProfile.mutateAsync({ onboardingCompleted: true });
        navigate('/', { replace: true });
        return;
      }
      await onboarding.mutateAsync({
        goals: goals.map((title) => ({ title })),
        habits: habits.map((h) => ({ name: h.name, color: h.color })),
        routines: routines.map((r) => ({
          name: r.name,
          timeOfDay: r.timeOfDay,
          items: r.items.map((title) => ({ title })),
        })),
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Une erreur est survenue. Réessayez.');
    }
  }

  const busy = onboarding.isPending || updateProfile.isPending || skipping;

  return (
    <div className="screen">
      <div className="onboarding-progress" aria-label={`Étape ${step + 1} sur 3`}>
        {steps.map((s, i) => (
          <div
            key={s}
            className={`onboarding-progress__step ${i <= step ? 'onboarding-progress__step--active' : ''}`}
          />
        ))}
      </div>

      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {step === 0 && (
        <section className="stack">
          <div className="auth-logo" style={{ alignItems: 'flex-start' }}>
            <h1 className="h-title">Qu’est-ce que vous voulez améliorer ?</h1>
            <p className="small muted">Choisissez un ou plusieurs objectifs. Ils guideront vos habitudes.</p>
          </div>
          <div className="stack stack--tight">
            {GOAL_TEMPLATES.map((g) => {
              const selected = goals.includes(g.title);
              return (
                <button
                  key={g.title}
                  type="button"
                  className={`template-card ${selected ? 'template-card--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() =>
                    setGoals((prev) =>
                      prev.includes(g.title) ? prev.filter((t) => t !== g.title) : [...prev, g.title],
                    )
                  }
                >
                  <span className="template-card__emoji" aria-hidden="true">{g.emoji}</span>
                  <span className="strong">{g.title}</span>
                </button>
              );
            })}
          </div>
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <div style={{ flex: 1 }}>
              <TextField
                label="Objectif personnalisé"
                placeholder="Ex. Courir 10 km"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                maxLength={120}
              />
            </div>
            <Button
              variant="secondary"
              style={{ marginTop: 22 }}
              disabled={customGoal.trim().length === 0 || goals.includes(customGoal.trim())}
              onClick={() => {
                const t = customGoal.trim();
                if (t && !goals.includes(t)) setGoals((prev) => [...prev, t]);
                setCustomGoal('');
              }}
            >
              Ajouter
            </Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="stack">
          <div>
            <h1 className="h-title">Vos premières habitudes</h1>
            <p className="small muted">Petites, quotidiennes, tenables. Vous pourrez tout ajuster ensuite.</p>
          </div>
          <div className="stack stack--tight">
            {HABIT_TEMPLATES.map((h) => {
              const selected = habits.some((x) => x.name === h.name);
              return (
                <button
                  key={h.name}
                  type="button"
                  className={`template-card ${selected ? 'template-card--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() =>
                    setHabits((prev) =>
                      prev.some((x) => x.name === h.name)
                        ? prev.filter((x) => x.name !== h.name)
                        : [...prev, h],
                    )
                  }
                >
                  <span className="template-card__emoji" aria-hidden="true">{h.emoji}</span>
                  <span className="strong">{h.name}</span>
                </button>
              );
            })}
          </div>
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <div style={{ flex: 1 }}>
              <TextField
                label="Habitude personnalisée"
                placeholder="Ex. 10 pompes"
                value={customHabit}
                onChange={(e) => setCustomHabit(e.target.value)}
                maxLength={80}
              />
            </div>
            <Button
              variant="secondary"
              style={{ marginTop: 22 }}
              disabled={customHabit.trim().length === 0}
              onClick={() => {
                const name = customHabit.trim();
                if (name && !habits.some((h) => h.name === name)) {
                  setHabits((prev) => [...prev, { name, emoji: '⭐', color: '#F97316' }]);
                }
                setCustomHabit('');
              }}
            >
              Ajouter
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="stack">
          <div>
            <h1 className="h-title">Votre première routine</h1>
            <p className="small muted">Une suite d’actions qui se déclenche toute seule, matin ou soir.</p>
          </div>
          <div className="stack stack--tight">
            {ROUTINE_TEMPLATES.map((r) => {
              const selected = routines.some((x) => x.name === r.name);
              return (
                <button
                  key={r.name}
                  type="button"
                  className={`template-card ${selected ? 'template-card--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() =>
                    setRoutineTemplates((prev) =>
                      prev.some((x) => x.name === r.name)
                        ? prev.filter((x) => x.name !== r.name)
                        : [...prev, r],
                    )
                  }
                >
                  <span className="template-card__emoji" aria-hidden="true">{r.emoji}</span>
                  <span>
                    <span className="strong" style={{ display: 'block' }}>{r.name}</span>
                    <span className="xsmall muted">{r.items.join(' · ')}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="stack" style={{ marginTop: 'var(--space-6)' }}>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={busy}>
              Retour
            </Button>
          )}
          {step < 2 ? (
            <Button block onClick={() => setStep(step + 1)} disabled={busy}>
              Continuer
            </Button>
          ) : (
            <Button block onClick={() => void finish(false)} pending={onboarding.isPending}>
              Démarrer Charbon
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          block
          disabled={busy}
          onClick={() => {
            setSkipping(true);
            void finish(true);
          }}
        >
          Passer et explorer par moi-même
        </Button>
        {step === 0 && (
          <p className="xsmall faint center" aria-hidden="true">
            <CharbonMark size={0} />
          </p>
        )}
      </div>
    </div>
  );
}
