import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

/*
  The operating panel (design-system section 5.1): graphite rail flush left, one
  white rounded-xl panel inset 8px top/right/bottom from the canvas, a 44px top
  bar with the breadcrumb and the static integration label, and the page content
  scrolling inside the panel. No hooks, so it can be rendered from a server
  layout. Shared by src/app/(dashboard)/layout.tsx and the dev-only design
  preview so the two shells can never drift apart again.
*/
export function AppShell({
  userEmail,
  pathname,
  children,
}: {
  userEmail?: string | null;
  /** Route to highlight in the rail and breadcrumb; defaults to the live pathname. */
  pathname?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm focus:text-ink focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <Sidebar userEmail={userEmail} pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col py-2 pr-2">
        <main
          id="main"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel"
        >
          <TopBar userEmail={userEmail} pathname={pathname} />
          <div className="min-h-0 flex-1 overflow-y-auto scroll-stable">
            <div className="mx-auto w-full max-w-[1400px] px-6 py-5">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
