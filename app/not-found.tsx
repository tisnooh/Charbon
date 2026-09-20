import Link from 'next/link';
import { copy } from '@/content';
import { cn, container } from '@/lib/utils/cn';

export default function NotFound() {
  const n = copy.notFound;

  return (
    <div className={cn(container, 'flex min-h-[70vh] flex-col items-center justify-center py-32 text-center')}>
      <p className="text-[7rem] font-extralight leading-none tracking-[-0.04em] text-ember-500/90">{n.code}</p>
      <h1 className="mt-6 text-display-md text-ink-100">{n.title}</h1>
      <p className="mt-4 max-w-sm text-[0.98rem] leading-relaxed text-ink-500">{n.text}</p>
      <Link
        href="/"
        className="mt-10 inline-flex min-h-[46px] items-center justify-center rounded-pill bg-ember-500 px-7 py-3 text-[0.95rem] font-semibold text-coal-950 transition-colors hover:bg-ember-400"
      >
        {n.cta}
      </Link>
    </div>
  );
}
