import { PageHeader } from '@/components/ui';
import { CallsTable } from '@/components/CallsTable';
import type { CallRecord } from '@/lib/types';

export type CallsViewProps = {
  /** Recent calls, newest first (ordered by started_at desc, max 200). */
  calls: CallRecord[];
};

export function CallsView({ calls }: CallsViewProps) {
  return (
    <div>
      <PageHeader
        title="Calls"
        subtitle="Recent inbound calls handled by the Prime Air voice agent"
      />
      <CallsTable calls={calls} />
    </div>
  );
}
