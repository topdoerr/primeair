import { AppShell } from '@/components/AppShell';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gated this route; guard here too so a transient auth
  // error renders the shell signed-out rather than 500-ing the dashboard.
  let user: { email?: string } | null = null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // Operating panel shell (design-system 5.1) lives in AppShell, shared with the dev preview.
  return <AppShell userEmail={user?.email}>{children}</AppShell>;
}
