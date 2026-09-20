'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { copy } from '@/content';
import { getUtm, track } from '@/lib/analytics';
import { isValidEmail } from '@/lib/validation/email';
import { Button } from '@/components/ui/Button';
import { Close, Spark } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';
import type { WaitlistApiResponse, WaitlistErrorCode } from '@/types';

type Status = 'idle' | 'loading' | 'success' | 'error';
type ErrorKey = keyof typeof copy.waitlist.errors;

/**
 * Mode démo : permet de visualiser chaque état UI sans backend.
 * Actif en développement, ou en build staging via NEXT_PUBLIC_CHARBON_DEMO=1
 * (variable inlinée au build — jamais active en production par défaut).
 */
const DEMO_ENABLED =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_CHARBON_DEMO === '1';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: string;
}

/**
 * Modal waitlist accessible : focus trap, fermeture ESC / backdrop,
 * restauration du focus, scroll verrouillé, honeypot invisible,
 * états idle / loading / success / error (dont doublon).
 */
export function WaitlistModal({ isOpen, onClose, source }: WaitlistModalProps) {
  const w = copy.waitlist;
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);

  /* Ouverture : focus champ, verrouillage du scroll. Fermeture : restore. */
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setStatus('idle');
    setErrorKey(null);
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  /* ESC + focus trap. */
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (node) => node.offsetWidth > 0 || node.offsetHeight > 0,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    track('waitlist_started', { source });

    const trimmed = email.trim();
    if (trimmed.length === 0) {
      setErrorKey('empty');
      setStatus('error');
      inputRef.current?.focus();
      return;
    }
    if (!isValidEmail(trimmed)) {
      setErrorKey('invalid_email');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorKey(null);

    /* Mode démo : ?demo=success|duplicate|invalid|error|loading */
    if (DEMO_ENABLED) {
      const demo = new URLSearchParams(window.location.search).get('demo');
      if (demo) {
        if (demo === 'invalid') {
          setStatus('error');
          setErrorKey('invalid_email');
          return;
        }
        if (demo === 'loading') return;
        window.setTimeout(() => {
          if (demo === 'duplicate') {
            setStatus('error');
            setErrorKey('duplicate');
            track('waitlist_duplicate', { source });
          } else if (demo === 'error') {
            setStatus('error');
            setErrorKey('backend_unavailable');
          } else {
            setStatus('success');
            track('waitlist_completed', { source, demo: true });
          }
        }, 700);
        return;
      }
    }

    try {
      const utm = getUtm();
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          source,
          locale: copy.meta.locale,
          utm: { source: utm.utm_source, medium: utm.utm_medium, campaign: utm.utm_campaign },
          website: '', // honeypot — toujours vide côté humain
        }),
      });
      const data = (await response.json()) as WaitlistApiResponse;

      if (data.ok) {
        setStatus('success');
        track('waitlist_completed', { source });
        return;
      }

      const code: WaitlistErrorCode = data.code;
      setErrorKey(code === 'unexpected' ? 'unexpected' : code);
      setStatus('error');
      if (code === 'duplicate') track('waitlist_duplicate', { source });
    } catch {
      setErrorKey('backend_unavailable');
      setStatus('error');
    }
  };

  const errorMessage = errorKey ? w.errors[errorKey] : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      {/* Backdrop */}
      <div
        aria-hidden
        className="animate-fade-in absolute inset-0 bg-black/80 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Panneau */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        aria-describedby="waitlist-desc"
        className="animate-sheet-up relative w-full max-w-md rounded-t-sheet border border-line-strong bg-coal-900 p-6 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.95)] sm:rounded-sheet sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={w.close}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-coal-800 hover:text-ink-100"
        >
          <Close className="h-5 w-5" />
        </button>

        {status === 'success' ? (
          <div className="pt-2 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ember-700/70 bg-ember-900/30 text-ember-500">
              <Spark className="h-6 w-6" />
            </span>
            <h2 id="waitlist-title" className="mt-5 text-2xl font-semibold tracking-tight text-ink-100">
              {w.successTitle}
            </h2>
            <p id="waitlist-desc" className="mx-auto mt-3 max-w-xs text-[0.95rem] leading-relaxed text-ink-400">
              {w.successText}
            </p>
            <Button variant="ghost" size="md" full className="mt-7" onClick={onClose}>
              {w.close}
            </Button>
          </div>
        ) : (
          <>
            <p className="flex items-center gap-2 text-label uppercase tracking-label text-ember-500">
              <Spark className="h-3.5 w-3.5" aria-hidden />
              {copy.hero.label}
            </p>
            <h2 id="waitlist-title" className="mt-3 text-2xl font-semibold tracking-tight text-ink-100">
              {w.title}
            </h2>
            <p id="waitlist-desc" className="mt-3 text-[0.95rem] leading-relaxed text-ink-400">
              {w.text}
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6">
              {/* Honeypot — invisible pour les humains */}
              <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="waitlist-website">Ne pas remplir</label>
                <input id="waitlist-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <label htmlFor="waitlist-email" className="mb-2 block text-sm font-medium text-ink-300">
                {w.fieldLabel}
              </label>
              <input
                ref={inputRef}
                id="waitlist-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={w.placeholder}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') {
                    setStatus('idle');
                    setErrorKey(null);
                  }
                }}
                aria-invalid={status === 'error' || undefined}
                aria-describedby={errorMessage ? 'waitlist-error' : undefined}
                className={cn('field', status === 'error' && 'border-ember-600')}
              />

              {errorMessage ? (
                <p id="waitlist-error" role="alert" className="mt-2.5 text-sm text-ember-300">
                  {errorMessage}
                </p>
              ) : null}

              <Button type="submit" variant="primary" size="lg" full loading={status === 'loading'} className="mt-5">
                {status === 'loading' ? w.loading : w.cta}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs leading-relaxed text-ink-600">{w.legalNote}</p>
          </>
        )}
      </div>
    </div>
  );
}
