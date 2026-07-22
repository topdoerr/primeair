import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';
import { CallsTable } from '@/components/CallsTable';
import type { CallRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CallsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('calls')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Calls"
        subtitle="Recent inbound calls handled by the Prime Air voice agent"
      />
      <CallsTable calls={(data ?? []) as CallRecord[]} />
    </div>
  );
}
