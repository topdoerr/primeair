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
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5">
        {/* Hotlinked from the company site; swap for /logo.png to self-host. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://primeaircorp.com/wp-content/uploads/2025/03/Prime-Global-Logistics-Logo-e1753980018767.png"
          alt="Prime Air Corp"
          className="mb-2 h-9 w-auto"
        />
        <div className="text-xs text-slate-500">MIA → SJU air cargo</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                active
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-4 py-4">
        <div className="mb-2 truncate text-xs text-slate-500" title={userEmail ?? ''}>
          {userEmail ?? 'Not signed in'}
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
