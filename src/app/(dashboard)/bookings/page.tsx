import { createClient } from '@/lib/supabase/server';
import { BookingsView } from '@/components/views/BookingsView';
import type { Booking, Customer } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = createClient();
  const [{ data: bookingRows }, { data: customerRows }] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').eq('is_recurring', true).order('name'),
  ]);
  const bookings = (bookingRows ?? []) as Booking[];
  const customers = (customerRows ?? []) as Customer[];

  return <BookingsView bookings={bookings} customers={customers} />;
}
