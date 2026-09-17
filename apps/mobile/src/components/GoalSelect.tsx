/** Sélecteur d'objectif (optionnel) partagé par les sheets tâche/habitude. */
import type { GoalDTO } from '@charbon/shared';
import { useGoals } from '../api/hooks.js';

export function GoalSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (goalId: string | null) => void;
}) {
  const goals = useGoals('active');
  const items = goals.data?.items ?? [];
  if (goals.isPending) return <div className="skeleton" style={{ height: 48 }} />;
  if (items.length === 0) return null; // aucun objectif actif : champ masqué (pas de faux choix)

  return (
    <div className="field">
      <label className="field__label" htmlFor="goal-select">
        Objectif lié (optionnel)
      </label>
      <select
        className="field__select"
        id="goal-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      >
        <option value="">Aucun</option>
        {items.map((g: GoalDTO) => (
          <option key={g.id} value={g.id}>
            {g.title}
          </option>
        ))}
      </select>
    </div>
  );
}
