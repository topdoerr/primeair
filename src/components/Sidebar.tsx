'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/calls', label: 'Calls', icon: '📞' },
  { href: '/awb', label: 'AWB Lookup', icon: '📦' },
  { href: '/discrepancies', label: 'Discrepancy Reports', icon: '🧾' },
  { href: '/assistant', label: 'Assistant', icon: '🤖' },
];

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5">
        <div className="text-base font-semibold text-brand-900">Prime Air Corp</div>
        <div className="text-xs text-slate-500">MIA → SJU air cargo</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                active
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
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
