import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 text-balance">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.06)]">
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-brand-500 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  RECONCILED: 'bg-accent-50 text-accent-700 ring-accent-200',
  FLAGGED: 'bg-red-50 text-red-700 ring-red-200',
  AVAILABLE: 'bg-accent-50 text-accent-700 ring-accent-200',
  ARRIVED: 'bg-sky-50 text-sky-700 ring-sky-200',
  IN_TRANSIT: 'bg-amber-50 text-amber-700 ring-amber-200',
  PICKED_UP: 'bg-slate-100 text-slate-600 ring-slate-200',
  SCHEDULED: 'bg-brand-50 text-brand-700 ring-brand-200',
  // ticket status
  OPEN: 'bg-amber-50 text-amber-700 ring-amber-200',
  CLOSED: 'bg-slate-100 text-slate-500 ring-slate-200',
  // ticket priority
  HIGH: 'bg-red-50 text-red-700 ring-red-200',
  NORMAL: 'bg-sky-50 text-sky-700 ring-sky-200',
  LOW: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export function Badge({ children }: { children: string }) {
  const style = BADGE_STYLES[children] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {children.replace(/_/g, ' ')}
    </span>
  );
}

const INTENT_LABELS: Record<string, string> = {
  awb_status: 'AWB status',
  schedule_pickup: 'Schedule pickup',
  invoice_question: 'Invoice question',
  other: 'Other',
};

export function IntentBadge({ intent }: { intent: string | null }) {
  const label = intent ? INTENT_LABELS[intent] ?? intent : '—';
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-border">
      {label}
    </span>
  );
}
