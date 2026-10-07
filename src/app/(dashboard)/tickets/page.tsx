import { createClient } from '@/lib/supabase/server';
import { TicketsView } from '@/components/views/TicketsView';
import type { Ticket } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  const tickets = (data ?? []) as Ticket[];

  return <TicketsView tickets={tickets} />;
}
