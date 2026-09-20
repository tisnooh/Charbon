import { Battery, Signal, Wifi } from '@/components/ui/icons';

/** Barre d'état iOS — fidèle aux captures (9:41). */
export function StatusBar({ time = '9:41' }: { time?: string }) {
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[8cqw] pt-[3cqw]">
      <span className="text-[3cqw] font-semibold tracking-tight text-ink-100">{time}</span>
      <span className="flex items-center gap-[1.4cqw] text-ink-100">
        <Signal className="h-[2.8cqw] w-[2.8cqw]" />
        <Wifi className="h-[3cqw] w-[3cqw]" />
        <Battery className="h-[3.2cqw] w-[3.2cqw]" />
      </span>
    </div>
  );
}

/** Indicateur d'accueil iOS. */
export function HomeIndicator() {
  return <div aria-hidden className="mx-auto mt-[2.4cqw] h-[1cqw] w-[30cqw] rounded-pill bg-ink-500" />;
}
