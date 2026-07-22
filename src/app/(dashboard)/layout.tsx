import { Sidebar } from '@/components/Sidebar';
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userEmail={user?.email} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
