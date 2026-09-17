/**
 * Primitives UI Charbon — chaque composant gère ses états réels :
 * pending (spinner + disabled), error, empty. Aucun élément factice.
 */
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { CheckIcon, XIcon } from './icons.js';

/* ---------------- Bouton ---------------- */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline';
  size?: 'md' | 'sm';
  block?: boolean;
  pending?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  pending = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} disabled={disabled || pending} aria-busy={pending} {...rest}>
      {pending && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ---------------- Champs de formulaire ---------------- */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function TextField({ label, error, hint, id, ...rest }: FieldProps) {
  const inputId = id ?? `f-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input className="field__input" id={inputId} aria-invalid={!!error} {...rest} />
      {hint && !error && <span className="xsmall faint">{hint}</span>}
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
}

export function TextArea({ label, error, id, ...rest }: TextAreaProps) {
  const inputId = id ?? `ta-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <textarea className="field__textarea" id={inputId} aria-invalid={!!error} {...rest} />
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="switch" aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch__track" />
      <span className="switch__thumb" />
    </label>
  );
}

/* ---------------- Bottom sheet ---------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="sheet"
      >
        <div className="sheet__handle" aria-hidden="true" />
        <div className="row row--between" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 className="sheet__title" style={{ marginBottom: 0 }}>
            {title}
          </h2>
          <button className="btn btn--icon btn--sm" onClick={onClose} aria-label="Fermer" style={{ width: 36, height: 36, minHeight: 36 }}>
            <XIcon width={16} height={16} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

/* ---------------- Dialogue de confirmation ---------------- */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onCancel} aria-hidden="true" />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="dialog__title">{title}</div>
        <div className="dialog__body">{body}</div>
        <div className="dialog__actions">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} pending={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ---------------- États (vide, erreur, chargement) ---------------- */

export function EmptyState({
  icon = '✨',
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="empty-state__title">{title}</div>
      {body && <p className="small">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon" aria-hidden="true">
        ⚠️
      </div>
      <p className="small muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton--row" />
      ))}
    </div>
  );
}

/* ---------------- Données / progression ---------------- */

export function ProgressRing({
  pct,
  size = 96,
  caption,
}: {
  pct: number;
  size?: number;
  caption?: string;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="emberGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ember)" />
            <stop offset="100%" stopColor="var(--amber)" />
          </linearGradient>
        </defs>
        <circle className="progress-ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
        />
      </svg>
      <div className="progress-ring__label">
        <span className="progress-ring__pct">{Math.round(clamped * 100)}%</span>
        {caption && <span className="progress-ring__caption">{caption}</span>}
      </div>
    </div>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="progressbar" role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progressbar__fill" style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}

export function CheckCircle({
  checked,
  onToggle,
  label,
  square = false,
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  square?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`check-circle ${checked ? 'check-circle--done' : ''} ${square ? 'check-circle--square' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
      aria-label={label}
      data-testid="check-circle"
    >
      <CheckIcon />
    </button>
  );
}

export function StreakBadge({
  current,
  atRisk = false,
  title,
}: {
  current: number;
  atRisk?: boolean;
  title?: string;
}) {
  return (
    <span className={`streak-badge ${atRisk ? 'streak-badge--risk' : ''}`} title={title}>
      🔥 {current}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={`segmented__option ${value === o.value ? 'segmented__option--active' : ''}`}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Sélecteur de jours ---------------- */

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function DayPicker({
  days,
  onChange,
}: {
  days: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (d: number) => {
    onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());
  };
  return (
    <div className="daypicker" role="group" aria-label="Jours de la semaine">
      {DAY_LABELS.map((label, i) => (
        <button
          key={i}
          type="button"
          className={`daypicker__day ${days.includes(i) ? 'daypicker__day--active' : ''}`}
          onClick={() => toggle(i)}
          aria-pressed={days.includes(i)}
          aria-label={['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][i]}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
