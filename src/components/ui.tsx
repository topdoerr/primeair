import Link from 'next/link';
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  InputHTMLAttributes,
  KeyboardEvent,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import {
  AlertIcon,
  ArrowDownRightIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  InboxIcon,
  Spinner,
} from '@/components/icons';

export { Drawer, DrawerHeader, DrawerSection } from '@/components/Drawer';
export { BrandLockup, BrandMark, PoweredByOnda, RouteStrip } from '@/components/Brand';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Tiny class joiner (no deps). Falsy values are dropped. */
export function cn(...parts: Array<unknown>) {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
export const cx = cn;

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  description,
  eyebrow,
  meta,
  action,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Alias of subtitle. */
  description?: ReactNode;
  /** Small line above the title; usually a back link on detail pages. */
  eyebrow?: ReactNode;
  /** Facts row under the subtitle; wrap figures in <Num>/<Id>, separate with <Dot/>. */
  meta?: ReactNode;
  action?: ReactNode;
  /** Alias of action; both render in the right slot. */
  actions?: ReactNode;
  className?: string;
}) {
  const sub = subtitle ?? description;
  return (
    <header className={cn('mb-5 flex items-end justify-between gap-6', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs text-ink-3">{eyebrow}</div>}
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-[-0.02em] text-ink text-balance">
          {title}
        </h1>
        {sub && <p className="mt-1 max-w-[64ch] text-base text-ink-3 text-pretty">{sub}</p>}
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3 [&_b]:font-medium [&_b]:text-ink-2">
            {meta}
          </div>
        )}
      </div>
      {(action || actions) && (
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {actions}
        </div>
      )}
    </header>
  );
}

/** Dot separator between meta chips (never a typed middle dot). */
export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn('h-0.5 w-0.5 shrink-0 rounded-full bg-line-strong', className)} />;
}

/** Section title inside a page (not a card). */
export function SectionHeading({
  children,
  count,
  action,
  className,
}: {
  children: ReactNode;
  count?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-sm font-semibold tracking-[-0.01em] text-ink">
        {children}
        {count !== undefined && <span className="ml-2 font-mono text-xs font-normal text-ink-3">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

/** Small sentence-case label above a group inside a card body. */
export function SectionLabel({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  if (action) {
    return (
      <div className={cn('mb-2 flex items-center justify-between gap-3 text-xs font-medium text-ink-3', className)}>
        <span>{children}</span>
        {action}
      </div>
    );
  }
  return <div className={cn('mb-2 text-xs font-medium text-ink-3', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Inline helpers                                                      */
/* ------------------------------------------------------------------ */

export function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[0.96em] tracking-[-0.01em] tnum', className)}>{children}</span>;
}

export const Mono = Num;

export function Id({
  children,
  href,
  link,
  className,
}: {
  children: ReactNode;
  href?: string;
  link?: boolean;
  className?: string;
}) {
  const base = 'font-mono text-[0.96em] tracking-[-0.01em] text-ink';
  if (href && link !== false) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          'rounded-sm underline decoration-line-strong underline-offset-[3px] transition-colors duration-100 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        {children}
      </Link>
    );
  }
  return <span className={cn(base, className)}>{children}</span>;
}

export function Route({ from = 'MIA', to = 'SJU', className }: { from?: string; to?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-[0.96em] tracking-[-0.01em] text-ink', className)}>
      <span>{from}</span>
      <ArrowRightIcon size={12} className="h-3 w-3 text-ink-4" />
      <span>{to}</span>
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn('rounded-sm border border-line-strong bg-surface-sunken px-1 font-mono text-2xs text-ink-2', className)}>
      {children}
    </kbd>
  );
}

/** Quiet en dash for empty cells. */
export function Null({ className }: { className?: string }) {
  return (
    <span className={cn('text-ink-4', className)} aria-label="none">
      –
    </span>
  );
}

export function Divider({ vertical = false, className }: { vertical?: boolean; className?: string }) {
  return <span aria-hidden className={cn(vertical ? 'h-4 w-px bg-line' : 'block h-px w-full bg-line', className)} />;
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = '',
  padded = false,
}: {
  children: ReactNode;
  className?: string;
  /** Apply body padding directly (p-4); otherwise compose CardHeader/CardBody. */
  padded?: boolean;
}) {
  return <div className={cn('rounded-lg border border-line bg-surface', padded && 'p-4', className)}>{children}</div>;
}

export function CardHeader({
  title,
  count,
  children,
  actions,
  className,
}: {
  title?: ReactNode;
  count?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex h-11 items-center justify-between gap-3 border-b border-line px-4', className)}>
      <div className="flex min-w-0 items-center gap-2">
        {title !== undefined ? <CardTitle count={count}>{title}</CardTitle> : null}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardTitle({ children, count, className }: { children: ReactNode; count?: ReactNode; className?: string }) {
  return (
    <h3 className={cn('truncate text-sm font-semibold tracking-[-0.01em] text-ink', className)}>
      {children}
      {count !== undefined && <span className="ml-2 font-mono text-xs font-normal text-ink-3">{count}</span>}
    </h3>
  );
}

export function CardBody({
  children,
  className,
  variant = 'default',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dense' | 'flush' | 'roomy';
}) {
  const pad = { default: 'p-4', dense: 'p-3', flush: 'p-0', roomy: 'p-5' }[variant];
  return <div className={cn(pad, className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border-t border-line px-4 py-2.5 text-xs text-ink-3', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok-fg',
  warn: 'text-warn-fg',
  danger: 'text-danger-fg',
  info: 'text-info-fg',
  neutral: 'text-ink-3',
};

/** One bordered strip; the first cell is the headline (1.6fr). */
export function KpiStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 divide-y divide-line rounded-lg border border-line bg-surface lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:divide-x lg:divide-y-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  delta,
  deltaTone,
  icon,
  primary = false,
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** Segments separated by <Dot/>, e.g. <span><Num>3</Num> in transit</span>. */
  hint?: ReactNode;
  /** Optional change figure; direction is 'up' | 'down' | none via deltaTone. */
  delta?: ReactNode;
  deltaTone?: 'up' | 'down' | 'flat';
  icon?: ReactNode;
  /** Headline cell: 40px value. */
  primary?: boolean;
  /** Color for the delta text. */
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn('px-5 py-4', className)} data-primary={primary || undefined}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
        {icon && <span className="text-ink-4 [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
        {label}
      </div>
      <div
        className={cn(
          'mt-1.5 font-mono font-medium tracking-[-0.02em] text-ink tnum',
          primary ? 'text-4xl lg:text-5xl lg:leading-[44px]' : 'text-3xl leading-8',
        )}
      >
        {value}
      </div>
      {(hint || delta) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3">
          {delta && (
            <span className={cn('inline-flex items-center gap-1 font-mono text-xs tnum', tone ? TONE_TEXT[tone] : 'text-ink-2')}>
              {deltaTone === 'up' && <ArrowUpRightIcon size={12} />}
              {deltaTone === 'down' && <ArrowDownRightIcon size={12} />}
              {delta}
            </span>
          )}
          {delta && hint && <Dot />}
          {hint}
        </div>
      )}
    </div>
  );
}

/** Alias of Kpi (the brief's name). */
export const Stat = Kpi;

/** Legacy KPI tile: a bordered Kpi so existing 4-up grids keep working. */
export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface">
      <Kpi label={label} value={value} hint={hint} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export type StatusSpec = { tone: Tone; label: string; emphasis?: 'filled' };

export const STATUS: Record<string, StatusSpec> = {
  // ok (dot)
  RECONCILED: { tone: 'ok', label: 'Reconciled' },
  AVAILABLE: { tone: 'ok', label: 'Available' },
  COMPLETED: { tone: 'ok', label: 'Completed' },
  ACKNOWLEDGED: { tone: 'ok', label: 'Acknowledged' },
  CONFIRMED: { tone: 'ok', label: 'Confirmed' },
  SELF_SERVED: { tone: 'ok', label: 'Self-served' },
  // info (dot) = on plan / in motion
  ARRIVED: { tone: 'info', label: 'Arrived' },
  SCHEDULED: { tone: 'info', label: 'Scheduled' },
  IN_PROGRESS: { tone: 'info', label: 'In progress' },
  SENT: { tone: 'info', label: 'Sent' },
  VOICE_AGENT: { tone: 'info', label: 'Voice agent' },
  NORMAL: { tone: 'info', label: 'Normal' },
  // warn (dot) = needs a human eventually
  IN_TRANSIT: { tone: 'warn', label: 'In transit' },
  OPEN: { tone: 'warn', label: 'Open' },
  REQUESTED: { tone: 'warn', label: 'Requested' },
  ESCALATED: { tone: 'warn', label: 'Escalated' },
  TRANSFERRED: { tone: 'warn', label: 'Transferred' },
  // danger (filled) = exceptions only
  FLAGGED: { tone: 'danger', label: 'Flagged', emphasis: 'filled' },
  FAILED: { tone: 'danger', label: 'Failed', emphasis: 'filled' },
  HIGH: { tone: 'danger', label: 'High', emphasis: 'filled' },
  // neutral (dot)
  PICKED_UP: { tone: 'neutral', label: 'Picked up' },
  DASHBOARD: { tone: 'neutral', label: 'Dashboard' },
  CLOSED: { tone: 'neutral', label: 'Closed' },
  LOW: { tone: 'neutral', label: 'Low' },
  PENDING: { tone: 'neutral', label: 'Pending' },
  CANCELLED: { tone: 'neutral', label: 'Cancelled' },
  ABANDONED: { tone: 'neutral', label: 'Abandoned' },
};

export function humanize(value: string) {
  const words = String(value).toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Lookup key is upper-cased so call outcomes such as 'self_served' resolve. */
export function statusSpec(status: string): StatusSpec {
  return STATUS[String(status).toUpperCase()] ?? { tone: 'neutral', label: humanize(status) };
}

// Written out so Tailwind sees every tone class.
const DOT: Record<Tone, string> = {
  ok: 'bg-ok-dot',
  warn: 'bg-warn-dot',
  danger: 'bg-danger-dot',
  info: 'bg-info-dot',
  neutral: 'bg-neutral-dot',
};

const FILLED: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok-fg',
  warn: 'bg-warn-bg text-warn-fg',
  danger: 'bg-danger-bg text-danger-fg',
  info: 'bg-info-bg text-info-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
};

export function StatusPill({
  status,
  label,
  tone,
  filled,
  size = 'md',
  className,
}: {
  status?: string;
  /** Override the mapped label. */
  label?: ReactNode;
  /** Override the mapped tone. */
  tone?: Tone;
  /** Force the filled tier. */
  filled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const spec: StatusSpec = status ? statusSpec(status) : { tone: 'neutral', label: '' };
  const t = tone ?? spec.tone;
  const isFilled = filled ?? spec.emphasis === 'filled';
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md border font-medium',
        size === 'sm' ? 'h-5 gap-1 px-1.5 text-2xs' : 'h-[22px] gap-1.5 px-1.5 text-xs',
        isFilled ? cn('border-transparent', FILLED[t]) : 'border-line bg-surface text-ink-2',
        className,
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[t])} />
      {label ?? spec.label}
    </span>
  );
}

/** Spec name. */
export function StatusBadge({ status, size, className }: { status: string; size?: 'sm' | 'md'; className?: string }) {
  return <StatusPill status={status} size={size} className={className} />;
}

/** Backwards-compatible: `<Badge>FLAGGED</Badge>`. */
export function Badge({ children }: { children: string }) {
  return <StatusPill status={children} />;
}

/** Yes/No style dotted label without an enum. */
export function Dotted({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <StatusPill tone={tone} label={children} className={className} />;
}

export function Tag({
  children,
  size = 'md',
  muted = false,
  className,
}: {
  children: ReactNode;
  size?: 'sm' | 'md';
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md bg-surface-sunken font-medium',
        size === 'sm' ? 'h-5 px-1.5 text-2xs' : 'h-[22px] px-1.5 text-xs',
        muted ? 'text-ink-3' : 'text-ink-2',
        className,
      )}
    >
      {children}
    </span>
  );
}

const INTENT_LABELS: Record<string, string> = {
  awb_status: 'AWB status',
  schedule_pickup: 'Schedule pickup',
  invoice_question: 'Invoice question',
  other: 'Other',
};

export function IntentBadge({ intent, size }: { intent: string | null; size?: 'sm' | 'md' }) {
  if (!intent) {
    return (
      <Tag size={size} muted>
        Unspecified
      </Tag>
    );
  }
  return <Tag size={size}>{INTENT_LABELS[intent] ?? intent}</Tag>;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,box-shadow] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-ink-inverse shadow-primary hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'border border-line-strong bg-surface text-ink-2 shadow-control hover:bg-surface-hover hover:text-ink active:bg-surface-active',
  ghost: 'text-ink-2 hover:bg-surface-hover hover:text-ink active:bg-surface-active',
  danger: 'bg-danger-fg text-ink-inverse hover:bg-[#9a1d13] active:bg-[#7f170f]',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs [&_svg]:h-3.5 [&_svg]:w-3.5',
  md: 'h-8 px-3 text-sm [&_svg]:h-4 [&_svg]:w-4',
  lg: 'h-9 px-3.5 text-sm [&_svg]:h-4 [&_svg]:w-4',
};

const ICON_ONLY: Record<ButtonSize, string> = { sm: 'w-7 px-0', md: 'w-8 px-0', lg: 'w-9 px-0' };

export function buttonClasses({
  variant = 'secondary',
  size = 'md',
  iconOnly = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  className?: string;
}) {
  return cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], iconOnly && ICON_ONLY[size], className);
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  busy,
  iconOnly = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  /** Shows the Spinner in place of the icon and sets aria-busy. */
  loading?: boolean;
  /** Alias of loading. */
  busy?: boolean;
  /** Square icon button; pass aria-label. */
  iconOnly?: boolean;
}) {
  const isBusy = loading || busy;
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, iconOnly, className })}
      aria-busy={isBusy || undefined}
      disabled={disabled || isBusy}
      {...rest}
    >
      {isBusy ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon,
  trailingIcon,
  iconOnly = false,
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  iconOnly?: boolean;
}) {
  return (
    <Link className={buttonClasses({ variant, size, iconOnly, className })} {...rest}>
      {icon}
      {children}
      {trailingIcon}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const CONTROL_BASE =
  'block w-full rounded-md border border-line-strong bg-surface text-base text-ink placeholder:text-ink-4 shadow-control-inset transition-[border-color,box-shadow] duration-100 hover:border-ink-4 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:bg-surface-sunken disabled:text-ink-4 disabled:hover:border-line-strong aria-[invalid=true]:border-danger-dot aria-[invalid=true]:ring-danger-dot/25';

const CONTROL_SIZE = { md: 'h-8 px-2.5 text-sm', lg: 'h-9 px-3 text-base', xl: 'h-10 px-3 text-base' } as const;
export type ControlSize = keyof typeof CONTROL_SIZE;

export function Label({
  children,
  optional = false,
  className,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement> & { optional?: boolean }) {
  return (
    <label className={cn('block text-xs font-medium text-ink-2', className)} {...rest}>
      {children}
      {optional && <span className="ml-1 font-normal text-ink-4">(optional)</span>}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  optional,
  help,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  optional?: boolean;
  help?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} optional={optional}>
          {label}
        </Label>
      )}
      {children}
      {error ? <p className="text-xs text-danger-fg">{error}</p> : help ? <p className="text-xs text-ink-3">{help}</p> : null}
    </div>
  );
}

export function Input({
  size = 'md',
  mono = false,
  leading,
  suffix,
  className,
  invalid,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: ControlSize;
  mono?: boolean;
  /** Leading 16px icon rendered inside the control. */
  leading?: ReactNode;
  /** Trailing unit text, e.g. "kg". */
  suffix?: ReactNode;
  invalid?: boolean;
}) {
  const input = (
    <input
      className={cn(
        CONTROL_BASE,
        CONTROL_SIZE[size],
        mono && 'font-mono tracking-[-0.01em] placeholder:font-sans placeholder:tracking-normal',
        leading && 'pl-8',
        suffix && 'pr-9',
        rest.type === 'date' && '[&::-webkit-calendar-picker-indicator]:opacity-60',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
  if (!leading && !suffix) return input;
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4 [&_svg]:h-4 [&_svg]:w-4">
          {leading}
        </span>
      )}
      {input}
      {suffix && (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-3">{suffix}</span>
      )}
    </div>
  );
}

export function Select({
  size = 'md',
  className,
  invalid,
  children,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { size?: ControlSize; invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cn(CONTROL_BASE, CONTROL_SIZE[size], 'appearance-none pr-8', className)}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
    </div>
  );
}

export function Textarea({
  mono = false,
  className,
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean; invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        CONTROL_BASE,
        'resize-y px-3 py-2 leading-5',
        mono && 'font-mono text-xs leading-[1.6] tracking-[-0.01em]',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export function Table({
  children,
  className,
  minWidth,
  wrapperClassName,
  footer,
  ...rest
}: TableHTMLAttributes<HTMLTableElement> & {
  /** Per page: Discrepancies 760, Calls 800, Tracking 880, Tickets 880, Bookings 920. */
  minWidth?: number;
  wrapperClassName?: string;
  /** Optional CardFooter-style note under the table. */
  footer?: ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border border-line bg-surface', wrapperClassName)}>
      <div className={cn('overflow-x-auto scroll-stable rounded-[inherit]', footer && 'rounded-b-none')}>
        <table className={cn('w-full border-collapse text-sm', className)} style={minWidth ? { minWidth } : undefined} {...rest}>
          {children}
        </table>
      </div>
      {footer && <div className="border-t border-line px-4 py-2.5 text-xs text-ink-3">{footer}</div>}
    </div>
  );
}

export function THead({ children, className, sticky = false }: { children: ReactNode; className?: string; sticky?: boolean }) {
  return <thead className={cn('bg-surface-sunken', sticky && 'sticky top-0 z-10', className)}>{children}</thead>;
}

export function TBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TR({
  children,
  className,
  href,
  selected = false,
  onClick,
  onKeyDown,
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & {
  /** Linked row: pass the same href to <RowLink> in the identifier cell. */
  href?: string;
  selected?: boolean;
}) {
  const clickable = Boolean(onClick);
  const linked = Boolean(href);
  const handleKey = clickable
    ? (e: KeyboardEvent<HTMLTableRowElement>) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLTableRowElement>);
        }
      }
    : onKeyDown;
  return (
    <tr
      className={cn(
        'group border-b border-line-subtle transition-colors duration-75 last:border-0 hover:bg-surface-hover',
        linked && '[&>td]:relative hover:shadow-row-rule',
        clickable && 'cursor-pointer hover:shadow-row-rule',
        selected && 'bg-surface-hover shadow-row-rule',
        className,
      )}
      onClick={onClick}
      onKeyDown={handleKey}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TH({
  children,
  className,
  align = 'left',
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-9 whitespace-nowrap border-b border-line px-3 text-xs font-medium text-ink-3 first:pl-4 last:pr-4',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
  align = 'left',
  mono = false,
  numeric = false,
  muted = false,
  primary = false,
  identifier = false,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right' | 'center';
  /** mono 12.5px ink. */
  mono?: boolean;
  /** mono, right-aligned, tabular. */
  numeric?: boolean;
  muted?: boolean;
  primary?: boolean;
  /** First-column identifier: mono 500 ink (strongest element in the row). */
  identifier?: boolean;
}) {
  return (
    <td
      className={cn(
        'h-11 px-3 align-middle text-ink-2 first:pl-4 last:pr-4',
        (mono || numeric || identifier) && 'font-mono text-[12.5px] tracking-[-0.01em] text-ink tnum',
        numeric && 'text-right',
        identifier && 'font-medium',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : undefined,
        muted && 'text-ink-3',
        primary && 'font-medium text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Stretched link for a `<TR href>` row; place inside the identifier TD. */
export function RowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-sm underline decoration-line-strong underline-offset-[3px] after:absolute after:inset-0 after:content-[""] group-hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Spec casing aliases. */
export const Th = TH;
export const Td = TD;
export const Tr = TR;

export function Toolbar({ children, actions, className }: { children?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-ink-3">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

/** Segmented meter: ink while in progress, green only when complete, cerulean on the live cell. */
export function Segments({
  done,
  total,
  current = false,
  label = true,
  className,
}: {
  done: number;
  total: number;
  /** Paint the next cell as in progress. */
  current?: boolean;
  label?: boolean;
  className?: string;
}) {
  const n = Math.max(total, 1);
  const complete = done >= n;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex w-24 gap-[3px]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-[2px]',
              i < done ? (complete ? 'bg-ok-dot' : 'bg-ink') : i === done && current ? 'bg-brand-500' : 'bg-line',
            )}
          />
        ))}
      </div>
      {label && (
        <span className="font-mono text-xs text-ink-2 tnum">
          {done}/{total}
        </span>
      )}
    </div>
  );
}

export const ProgressBar = Segments;

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ol className={cn('relative ml-1 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line-subtle', className)}>
      {children}
    </ol>
  );
}

export function TimelineStep({
  state,
  index,
  title,
  time,
  note,
  meta,
  last = false,
}: {
  state: 'completed' | 'active' | 'pending';
  /** 1-based; rendered zero-padded at lg. */
  index?: number;
  title: ReactNode;
  /** Right column: timestamp, "In progress", or "Expected". */
  time?: ReactNode;
  /** Second-row left: notes, <Tag size="sm">via portal</Tag>. */
  note?: ReactNode;
  /** Second-row right: elapsed since previous step, e.g. "+2h 14m". */
  meta?: ReactNode;
  last?: boolean;
}) {
  return (
    <li
      className={cn(
        'relative flex gap-3 pb-5 last:pb-0',
        state === 'completed' && !last && 'after:absolute after:bottom-[-20px] after:left-[7px] after:top-5 after:w-px after:bg-ok-dot',
      )}
    >
      <span className="relative z-10 mt-[5px] h-[15px] w-[15px] shrink-0">
        {state === 'completed' && (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-ok-dot text-ink-inverse">
            <CheckIcon size={9} strokeWidth={2.5} />
          </span>
        )}
        {state === 'active' && <span className="block h-full w-full animate-pulse-ring rounded-full bg-brand-500" />}
        {state === 'pending' && <span className="block h-full w-full rounded-full border border-line-strong bg-surface" />}
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
        <div className={cn('text-sm', state === 'pending' ? 'font-normal text-ink-3' : 'font-medium text-ink')}>
          {index !== undefined && (
            <span className="mr-2 hidden font-mono text-2xs text-ink-4 lg:inline">{String(index).padStart(2, '0')}</span>
          )}
          {title}
        </div>
        <div
          className={cn(
            'whitespace-nowrap text-right font-mono text-xs tnum',
            state === 'active' ? 'text-brand-700' : state === 'pending' ? 'text-ink-4' : 'text-ink-3',
          )}
        >
          {time}
        </div>
        {(note || meta) && (
          <>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-3">{note}</div>
            <div className="text-right font-mono text-2xs text-ink-4 tnum">{meta}</div>
          </>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state + notices                                               */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', size === 'sm' ? 'py-8' : 'py-12', className)}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-sunken text-ink-4 [&_svg]:h-4 [&_svg]:w-4">
        {icon ?? <InboxIcon />}
      </div>
      <div className="text-sm font-medium text-ink">{title}</div>
      {description && <div className="mt-1 max-w-[40ch] text-xs text-ink-3">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function InlineNotice({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'ok' | 'danger' | 'warn' | 'neutral';
  children: ReactNode;
  className?: string;
}) {
  const cls = {
    ok: 'border-ok-bg bg-ok-bg text-ok-fg',
    danger: 'border-danger-bg bg-danger-bg text-danger-fg',
    warn: 'border-warn-bg bg-warn-bg text-warn-fg',
    neutral: 'border-line bg-surface-sunken text-ink-2',
  }[tone];
  const Icon = tone === 'ok' ? CheckCircleIcon : tone === 'danger' || tone === 'warn' ? AlertIcon : null;
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('inline-flex animate-fade-in items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs', cls, className)}
    >
      {Icon && <Icon size={14} className="mt-px shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Key / value                                                         */
/* ------------------------------------------------------------------ */

export type KeyValueRow = { label: ReactNode; value: ReactNode; total?: boolean; key?: string };

export function KeyValue({ rows, columns = 1, className }: { rows: KeyValueRow[]; columns?: 1 | 2; className?: string }) {
  if (columns === 2) {
    return (
      <dl className={cn('grid grid-cols-2 gap-x-6 gap-y-3', className)}>
        {rows.map((r, i) => (
          <Fact key={r.key ?? i} label={r.label}>
            {r.value}
          </Fact>
        ))}
      </dl>
    );
  }
  return (
    <dl className={cn('divide-y divide-line-subtle', className)}>
      {rows.map((r, i) => (
        <SpecRow key={r.key ?? i} label={r.label} total={r.total}>
          {r.value}
        </SpecRow>
      ))}
    </dl>
  );
}

export function Spec({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('divide-y divide-line-subtle', className)}>{children}</dl>;
}

export function SpecRow({
  label,
  children,
  total = false,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  total?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[120px_1fr] items-center gap-3 py-2 text-sm first:pt-0 last:pb-0',
        total && 'mt-1 border-t border-line pt-3',
        className,
      )}
    >
      <dt className="text-ink-3">{label}</dt>
      <dd className={cn('min-w-0 truncate text-ink', total && 'font-mono text-lg font-medium tnum')}>{children}</dd>
    </div>
  );
}

export function Facts({ children, className, cols = 2 }: { children: ReactNode; className?: string; cols?: 2 | 3 }) {
  return <dl className={cn('grid gap-x-6 gap-y-3', cols === 3 ? 'grid-cols-3' : 'grid-cols-2', className)}>{children}</dl>;
}

export function Fact({
  label,
  children,
  mono = false,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className={cn('mt-0.5 text-sm text-ink', mono && 'font-mono tracking-[-0.01em] tnum')}>{children}</dd>
    </div>
  );
}

export function LedgerRow({
  label,
  value,
  strong = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** Total row: hairline above, 17px mono value. */
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between py-1.5 text-sm', strong && 'mt-1 border-t border-line pt-3', className)}>
      <span className="text-ink-3">{label}</span>
      <span className={cn('font-mono text-ink tnum', strong && 'text-lg font-medium')}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mono block (transcripts, XML)                                       */
/* ------------------------------------------------------------------ */

export function MonoBlock({
  children,
  label,
  meta,
  maxHeight = '28rem',
  className,
}: {
  children: ReactNode;
  /** Header strip label, e.g. "XML payload". */
  label?: ReactNode;
  /** Header strip right side, e.g. <><Num>{bytes}</Num> bytes</>. */
  meta?: ReactNode;
  maxHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-line-subtle bg-surface-sunken shadow-inset-top', className)}>
      {(label || meta) && (
        <div className="flex h-8 items-center justify-between border-b border-line-subtle px-3 text-2xs text-ink-3">
          <span>{label}</span>
          <span>{meta}</span>
        </div>
      )}
      <pre
        className="overflow-auto scroll-stable whitespace-pre-wrap break-words p-4 font-mono text-xs leading-[1.6] text-ink-2"
        style={{ maxHeight }}
      >
        {children}
      </pre>
    </div>
  );
}
