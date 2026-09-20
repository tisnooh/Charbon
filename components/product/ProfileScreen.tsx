import type { AppScreenCopy } from '@/types/content';
import { StatusBar } from '@/components/product/StatusBar';
import { TabBar } from '@/components/product/TabBar';
import { ScoreArc } from '@/components/product/ScoreArc';

type ProfileCopy = AppScreenCopy['profile'];

/**
 * Écran PROFIL — extrapolé depuis le langage visuel existant :
 * identité, Discipline Score, statistiques de constance, partage.
 */
export function ProfileScreen({ c, tabs }: { c: ProfileCopy; tabs: string[] }) {
  return (
    <div className="absolute inset-0">
      <StatusBar />

      <div className="px-[7cqw] pb-[24cqw] pt-[11cqw]">
        <p className="text-[2.9cqw] uppercase tracking-[0.3em] text-ink-500">{c.label}</p>
        <p className="mt-[2.5cqw] text-[7cqw] font-semibold tracking-[0.08em] text-ink-100">{c.name.toUpperCase()}</p>

        {/* Score */}
        <div className="relative mt-[6cqw]">
          <ScoreArc value={c.score} strokeWidth={2.6} className="absolute right-[1cqw] top-[-3cqw] aspect-square w-[62cqw]" delay={200} />
          <span className="relative block text-[30cqw] font-extralight leading-[0.95] tracking-[-0.03em] text-ember-500">
            {c.score}
          </span>
          <p className="relative mt-[2cqw] text-[2.7cqw] uppercase tracking-[0.26em] text-ink-300">{c.scoreLabel}</p>
        </div>

        {/* Statistiques */}
        <div className="mt-[7cqw] border-t border-line">
          {c.stats.map((s) => (
            <div key={s.label} className="flex items-center justify-between border-b border-line py-[3.4cqw]">
              <span className="text-[3.6cqw] text-ink-500">{s.label}</span>
              <span className="text-[3.8cqw] font-medium text-ink-100">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Partage */}
        <div className="mt-[6cqw] rounded-pill border border-ember-700/80 py-[3.4cqw] text-center text-[4cqw] font-semibold text-ember-500">
          {c.cta}
        </div>
      </div>

      <TabBar tabs={tabs} active={2} />
    </div>
  );
}
