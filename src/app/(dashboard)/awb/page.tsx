import { createClient } from '@/lib/supabase/server';
import { AwbLookupView } from '@/components/views/AwbLookupView';
import type { AirWaybill } from '@/lib/types';

export const dynamic = 'force-dynamic';

function normalizeAwb(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) return `810-${digits.slice(3)}`;
  if (/^810-[0-9]{8}$/.test(input.trim())) return input.trim();
  return null;
}

export default async function AwbLookupPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const supabase = createClient();

  let awb: AirWaybill | null = null;
  let notFound = false;

  if (q) {
    const mbn = normalizeAwb(q);
    if (mbn) {
      const { data } = await supabase
        .from('air_waybills')
        .select('*')
        .eq('master_bill_number', mbn)
        .maybeSingle();
      awb = (data as AirWaybill) ?? null;
      notFound = !awb;
    } else {
      notFound = true;
    }
  }

  return <AwbLookupView q={q} awb={awb} notFound={notFound} />;
}
