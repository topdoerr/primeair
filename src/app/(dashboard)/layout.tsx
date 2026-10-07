import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
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
    <div className="flex h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm focus:text-ink focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <Sidebar userEmail={user?.email} />
      <div className="flex min-w-0 flex-1 flex-col py-2 pr-2">
        <main
          id="main"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel"
        >
          <TopBar userEmail={user?.email} />
          <div className="min-h-0 flex-1 overflow-y-auto scroll-stable">
            <div className="mx-auto w-full max-w-[1400px] px-6 py-5">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
