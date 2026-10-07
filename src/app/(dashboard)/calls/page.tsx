import { createClient } from '@/lib/supabase/server';
import { CallsView } from '@/components/views/CallsView';
import type { CallRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CallsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('calls')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(200);

  const calls = (data ?? []) as CallRecord[];

  return <CallsView calls={calls} />;
}
