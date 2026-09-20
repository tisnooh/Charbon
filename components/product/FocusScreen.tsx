import type { AppScreenCopy } from '@/types/content';
import { StatusBar } from '@/components/product/StatusBar';
import { ScoreArc } from '@/components/product/ScoreArc';
import { Lock } from '@/components/ui/icons';

type FocusCopy = AppScreenCopy['focus'];

/**
 * Écran FOCUS — extrapolé strictement depuis le langage visuel existant :
 * même fond noir, même orange braise, même typographie fine,
 * anneau de progression inspiré de l'arc du Discipline Score.
 */
export function FocusScreen({ c, progress = 58 }: { c: FocusCopy; progress?: number }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <StatusBar />

      <div className="flex flex-1 flex-col items-center px-[7cqw] pt-[13cqw]">
        <p className="text-[2.9cqw] uppercase tracking-[0.3em] text-ink-500">{c.label}</p>

        {/* Anneau de progression + temps */}
        <div className="relative mt-[7cqw] h-[50cqw] w-[50cqw]">
          <ScoreArc variant="ring" value={progress} strokeWidth={1.6} className="absolute inset-0" delay={200} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[12cqw] font-extralight leading-none tracking-[-0.02em] text-ink-100">
              {c.elapsed}
            </span>
            <span className="mt-[1.5cqw] text-[3.8cqw] text-ink-500">{c.total}</span>
          </div>
        </div>

        {/* Engagement en cours */}
        <p className="mt-[8cqw] text-center text-[4.4cqw] font-medium leading-[1.35] text-ink-100">{c.task}</p>
        <span className="mt-[3cqw] rounded-pill border border-ember-700/70 px-[3.5cqw] py-[1.1cqw] text-[3.1cqw] text-ember-500">
          {c.priority}
        </span>

        {/* Barre de progression */}
        <div className="mt-[9cqw] w-full">
          <div className="h-[1.2cqw] w-full rounded-pill bg-[#1A1A19]">
            <div className="h-full rounded-pill bg-ember-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-[2cqw] flex justify-between text-[3cqw] text-ink-500">
            <span>{c.elapsed}</span>
            <span>{c.total.replace('/ ', '')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-[7cqw] flex w-full items-center gap-[3cqw]">
          <span className="flex-1 rounded-pill border border-[#2A2A28] py-[3.2cqw] text-center text-[3.8cqw] font-medium text-ink-200">
            {c.pause}
          </span>
          <span className="flex-1 rounded-pill bg-ember-500 py-[3.2cqw] text-center text-[3.8cqw] font-semibold text-coal-950">
            {c.finish}
          </span>
        </div>

        <span className="mt-[4cqw] text-[3.5cqw] text-ink-600">{c.quit}</span>

        <p className="mt-auto flex items-center gap-[1.6cqw] pb-[6cqw] text-[3.1cqw] text-ink-600">
          <Lock className="h-[3.2cqw] w-[3.2cqw] shrink-0" />
          {c.proofNote}
        </p>
      </div>
    </div>
  );
}
