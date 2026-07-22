'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, SVGProps } from 'react';
import {
  OverviewIcon,
  PhoneIcon,
  PackageIcon,
  ReceiptIcon,
  BotIcon,
  TicketIcon,
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

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar">
      <div className="px-5 pb-5 pt-6">
        <div className="rounded-lg bg-white/95 px-3 py-2.5">
          {/* Hotlinked from the company site; swap for /logo.png to self-host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://primeaircorp.com/wp-content/uploads/2025/03/Prime-Global-Logistics-Logo-e1753980018767.png"
            alt="Prime Air Corp"
            className="h-8 w-auto"
          />
        </div>
        <div className="mt-3 flex items-center gap-2 px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-sidebar-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden />
            MIA → SJU air cargo
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Main navigation">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
            {(userEmail?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-white" title={userEmail ?? ''}>
              {userEmail ?? 'Not signed in'}
            </div>
            <div className="text-[11px] text-sidebar-foreground/60">Operations</div>
          </div>
        </div>
        <form action="/api/auth/signout" method="post" className="mt-3">
          <button
            type="submit"
            className="w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-white/20 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
