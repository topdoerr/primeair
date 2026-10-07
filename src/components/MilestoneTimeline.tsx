import { Tag, Timeline, TimelineStep } from '@/components/ui';
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

// "+2h 14m" between two completed steps; null when either timestamp is missing.
function elapsed(fromIso: string | null, toIso: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.round(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `+${d}d ${h}h`;
  if (h > 0) return `+${h}h ${m}m`;
  return `+${m}m`;
}

// Step labels come from the milestone catalogue; typed middle dots are not UI copy.
function cleanLabel(label: string): string {
  return label.replace(/\s·\s/g, ', ');
}

// Vertical stepper on the 1px rail: completed (green check), in progress (cerulean node
// with the finite ring pulse), pending (hollow). Renders all six steps in order.
export function MilestoneTimeline({ milestones }: { milestones: ShipmentMilestone[] }) {
  return (
    <Timeline>
      {milestones.map((m, i) => {
        const last = i === milestones.length - 1;
        const completed = m.status === 'COMPLETED';
        const active = m.status === 'IN_PROGRESS';
        const state = completed ? 'completed' : active ? 'active' : 'pending';
        const prev = i > 0 ? milestones[i - 1] : null;
        const since =
          completed && prev && prev.status === 'COMPLETED' ? elapsed(prev.occurred_at, m.occurred_at) : null;
        const showNote = Boolean(m.notes) || (completed && Boolean(m.source));
        return (
          <TimelineStep
            key={m.code}
            index={i + 1}
            state={state}
            last={last}
            title={cleanLabel(m.label)}
            time={completed ? fmtWhen(m.occurred_at) : active ? 'In progress' : 'Expected'}
            note={
              showNote ? (
                <>
                  {m.notes && <span>{m.notes}</span>}
                  {completed && m.source && <Tag size="sm">via {m.source}</Tag>}
                </>
              ) : undefined
            }
            meta={since ?? undefined}
          />
        );
      })}
    </Timeline>
  );
}
