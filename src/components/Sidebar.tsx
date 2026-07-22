'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import {
  OverviewIcon,
  PhoneIcon,
  PackageIcon,
  ReceiptIcon,
  BotIcon,
  TicketIcon,
  MenuIcon,
  CloseIcon,
  ChevronLeftIcon,
} from '@/components/icons';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const NAV: { href: string; label: string; Icon: IconType }[] = [
  { href: '/', label: 'Overview', Icon: OverviewIcon },
  { href: '/calls', label: 'Calls', Icon: PhoneIcon },
  { href: '/awb', label: 'AWB Lookup', Icon: PackageIcon },
  { href: '/discrepancies', label: 'Discrepancy Reports', Icon: ReceiptIcon },
  { href: '/tickets', label: 'Tickets', Icon: TicketIcon },
  { href: '/assistant', label: 'Assistant', Icon: BotIcon },
];

function SidebarContent({
  userEmail,
  collapsed,
  onNavigate,
}: {
  userEmail?: string | null;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className={collapsed ? 'px-2 pb-4 pt-5' : 'px-5 pb-5 pt-6'}>
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Prime Global Logistics"
            className={collapsed ? 'h-12 w-auto' : 'h-28 w-auto'}
          />
        </div>
        {!collapsed && (
          <div className="mt-3 flex items-center justify-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-sidebar-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden />
              MIA → SJU air cargo
            </span>
          </div>
        )}
      </div>

      <nav
        className={`flex-1 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}
        aria-label="Main navigation"
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              className={`group flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors ${
                collapsed ? 'justify-center px-0' : 'px-3'
              } ${
                active
                  ? 'bg-brand-500 font-medium text-white shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  active ? 'text-white' : 'text-sidebar-foreground/60 group-hover:text-white'
                }`}
              />
              {!collapsed && label}
              {collapsed && <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={`mb-4 mt-4 rounded-xl bg-white/5 ring-1 ring-white/10 ${
          collapsed ? 'mx-2 p-2' : 'mx-3 p-4'
        }`}
      >
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white"
            title={userEmail ?? undefined}
          >
            {(userEmail?.[0] ?? '?').toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-white" title={userEmail ?? ''}>
                {userEmail ?? 'Not signed in'}
              </div>
              <div className="text-[11px] text-sidebar-foreground/60">Operations</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <form action="/api/auth/signout" method="post" className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-white/20 hover:text-white"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-sidebar px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Prime Global Logistics" className="h-10 w-auto" />
      </header>

      {/* Mobile drawer + backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-sidebar shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <SidebarContent
              userEmail={userEmail}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden shrink-0 flex-col bg-sidebar transition-[width] duration-200 md:flex ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent userEmail={userEmail} collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-md transition-colors hover:bg-brand-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeftIcon
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </aside>
    </>
  );
}
