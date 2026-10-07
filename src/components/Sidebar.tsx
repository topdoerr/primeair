'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS, isActive } from '@/components/nav';
import { BrandLockup, PoweredByOnda, RouteStrip } from '@/components/Brand';
import { LogOutIcon } from '@/components/icons';

/*
  Nav item recipes (design-system 5.2), written out as literal strings so Tailwind's
  scanner sees every class. The 8% tints use arbitrary alpha (`/[0.08]`): Tailwind 3.4's
  opacity scale steps 0, 5, 10, 15, ... so a bare `/8` modifier emits no CSS at all and the
  active tint silently disappeared. `/5` is a real step and stays as written.
*/
const NAV_ITEM_BASE =
  'group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:justify-center md:px-0 lg:justify-start lg:px-2';

// Active: 8% white tint, full-white 500 label, and the 2px white rule on the rail's left
// edge (the item sits 12px inside the aside's px-3, so left-[-12px] lands on x=0).
const NAV_ITEM_ACTIVE = `${NAV_ITEM_BASE} bg-sidebar-active/[0.08] font-medium text-sidebar-fg before:absolute before:left-[-12px] before:top-1.5 before:h-5 before:w-0.5 before:rounded-full before:bg-sidebar-fg`;

const NAV_ITEM_IDLE = `${NAV_ITEM_BASE} text-sidebar-fg/60 hover:bg-sidebar-hover/5 hover:text-sidebar-fg/90`;

// Graphite rail beside the operating panel. Rail mode (icons only) at md; full at lg.
export function Sidebar({
  userEmail,
  pathname: pathnameOverride,
}: {
  userEmail?: string | null;
  /** Route to mark active; defaults to the live pathname (dev preview passes the mirrored route). */
  pathname?: string;
}) {
  const livePathname = usePathname();
  const pathname = pathnameOverride ?? livePathname;

  return (
    <aside className="flex w-[232px] shrink-0 flex-col bg-sidebar-bg px-3 pb-3 pt-3 md:w-14 lg:w-[232px]">
      <BrandLockup size="sm" inverse className="md:justify-center md:px-0 lg:justify-start lg:px-2" textClassName="md:hidden lg:block" />

      <RouteStrip inverse className="mx-2 mt-3 md:hidden lg:flex" />

      <nav aria-label="Main navigation" className="mt-5 flex-1 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1 px-2 text-2xs font-medium text-sidebar-fg/40 md:hidden lg:block">{group.label}</div>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={label}
                      aria-current={active ? 'page' : undefined}
                      className={active ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}
                    >
                      <Icon
                        strokeWidth={active ? 1.75 : 1.5}
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-sidebar-fg' : 'text-sidebar-fg/40 group-hover:text-sidebar-fg/80'
                        }`}
                      />
                      <span className="truncate md:hidden lg:inline">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 md:justify-center md:px-0 lg:justify-start lg:px-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-fg text-2xs font-semibold text-sidebar-bg"
            aria-hidden
          >
            {(userEmail?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 md:hidden lg:block">
            <div className="truncate text-xs font-medium text-sidebar-fg" title={userEmail ?? ''}>
              {userEmail ?? 'Not signed in'}
            </div>
            <div className="truncate text-2xs text-sidebar-fg/45">Operations</div>
          </div>
          <form action="/api/auth/signout" method="post" className="ml-auto shrink-0 md:hidden lg:block">
            <button
              type="submit"
              className="h-7 shrink-0 whitespace-nowrap rounded-md px-2 text-xs text-sidebar-fg/60 transition-colors duration-100 hover:bg-sidebar-hover/5 hover:text-sidebar-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign out
            </button>
          </form>
        </div>
        <form action="/api/auth/signout" method="post" className="hidden justify-center md:flex lg:hidden">
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-fg/60 transition-colors duration-100 hover:bg-sidebar-hover/5 hover:text-sidebar-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOutIcon />
          </button>
        </form>
        <div className="flex items-center border-t border-sidebar-line/[0.08] px-2 pt-2.5 md:justify-center lg:justify-start">
          <PoweredByOnda inverse compact />
        </div>
      </div>
    </aside>
  );
}
