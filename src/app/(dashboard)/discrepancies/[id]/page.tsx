import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DiscrepancyDetailView } from '@/components/views/DiscrepancyDetailView';
import { parseDiscrepancyXml } from '@/lib/discrepancy-xml';
import type { DiscrepancyReport } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DiscrepancyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('discrepancy_reports')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();
  const report = data as DiscrepancyReport;
  const parsed = parseDiscrepancyXml(report.payload_xml);

  return <DiscrepancyDetailView report={report} parsed={parsed} />;
}
