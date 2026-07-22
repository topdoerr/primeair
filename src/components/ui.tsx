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
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
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
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </Card>
  );
}

const BADGE_STYLES: Record<string, string> = {
  RECONCILED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  FLAGGED: 'bg-red-50 text-red-700 ring-red-200',
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${style}`}
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
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
      {label}
    </span>
  );
}
