import { CallsTable } from '@/components/CallsTable';
import type { CallRecord } from '@/lib/types';

export type CallsViewProps = {
  /** Recent calls, newest first (ordered by started_at desc, max 200). */
  calls: CallRecord[];
};

/*
  Calls screen (design-system.md 7.9). The PageHeader lives inside CallsTable because
  its action slot is the Sync control, whose busy state and result notice are client
  state owned by the table; the data page and the dev preview only depend on this
  props contract.
*/
export function CallsView({ calls }: CallsViewProps) {
  return (
    <div>
      <CallsTable calls={calls} />
    </div>
  );
}
