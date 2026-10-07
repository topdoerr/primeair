import { CheckIcon } from '@/components/icons';
import type { ShipmentMilestone } from '@/lib/types';

function fmtWhen(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Vertical stepper: completed (green check), in progress (pulsing blue ring),
// pending (hollow grey). Renders all six steps in order.
export function MilestoneTimeline({ milestones }: { milestones: ShipmentMilestone[] }) {
  return (
    <ol className="relative">
      {milestones.map((m, i) => {
        const last = i === milestones.length - 1;
        const completed = m.status === 'COMPLETED';
        const active = m.status === 'IN_PROGRESS';
        return (
          <li key={m.code} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                className={`absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 ${
                  completed ? 'bg-accent-400' : 'bg-slate-200'
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                completed
                  ? 'bg-accent-500 text-white'
                  : active
                    ? 'bg-brand-500 text-white'
                    : 'border-2 border-slate-300 bg-white'
              }`}
            >
              {completed && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />}
              {active && (
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-400 opacity-60" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <div
                  className={`text-sm font-medium ${
                    completed || active ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {m.label}
                </div>
                <div className="text-xs text-slate-400">
                  {completed
                    ? fmtWhen(m.occurred_at)
                    : active
                      ? 'In progress'
                      : 'Pending'}
                </div>
              </div>
              {(m.notes || (completed && m.source)) && (
                <div className="mt-0.5 text-xs text-slate-500">
                  {m.notes}
                  {m.notes && completed && m.source ? ' · ' : ''}
                  {completed && m.source ? `via ${m.source}` : ''}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
