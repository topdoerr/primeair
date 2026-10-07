import { createClient } from '@/lib/supabase/server';
import { DiscrepanciesView } from '@/components/views/DiscrepanciesView';
import type { DiscrepancyReport } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DiscrepanciesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('discrepancy_reports')
    .select('*')
    .order('created_at', { ascending: false });

  const reports = (data ?? []) as DiscrepancyReport[];

  return <DiscrepanciesView reports={reports} />;
}
