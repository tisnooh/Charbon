import { BarsChart, Target, UserDisc } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

interface TabBarProps {
  tabs: [string, string, string] | string[];
  active?: number;
}

/** Barre de navigation basse — Aujourd'hui / Progrès / Profil, fidèle à l'app. */
export function TabBar({ tabs, active = 0 }: TabBarProps) {
  const icons = [Target, BarsChart, UserDisc];

  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 pb-[2.6cqw] pt-[2cqw]">
      <div className="mx-auto flex w-[84cqw] items-center justify-between rounded-pill border border-[#1D1D1C] bg-[#0C0C0C]/95 px-[7cqw] py-[2.6cqw]">
        {tabs.map((label, i) => {
          const TabIcon = icons[i] ?? Target;
          return (
            <div
              key={label}
              className={cn('flex flex-col items-center gap-[0.9cqw]', i === active ? 'text-ember-500' : 'text-ink-600')}
            >
              <TabIcon className="h-[4.8cqw] w-[4.8cqw]" strokeWidth={2.2} />
              <span className="text-[2.4cqw] font-medium">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-[2.6cqw] h-[0.9cqw] w-[28cqw] rounded-pill bg-ink-600/80" />
    </div>
  );
}
