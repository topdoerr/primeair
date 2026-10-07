'use client';

import { usePathname } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';
import { findCrumb } from '@/components/nav';
import { RouteStrip } from '@/components/Brand';
import { ChevronRightIcon } from '@/components/icons';

// Slim chrome above the operating panel: breadcrumb, static integration label,
// route strip and avatar in rail mode. `children` is a centered slot for a future palette.
export function TopBar({
  userEmail,
  pathname: pathnameOverride,
  children,
}: {
  userEmail?: string | null;
  /** Route for the breadcrumb; defaults to the live pathname (dev preview passes the mirrored route). */
  pathname?: string;
  children?: ReactNode;
}) {
  const livePathname = usePathname();
  const pathname = pathnameOverride ?? livePathname;
  const crumbs = findCrumb(pathname) ?? ['Prime Air'];

  return (
    <div className="sticky top-0 z-20 flex h-11 shrink-0 items-center justify-between border-b border-line bg-surface/85 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${crumb}-${i}`}>
              {i > 0 && <ChevronRightIcon size={12} className="h-3 w-3 shrink-0 text-ink-4" />}
              <span className={last ? 'truncate font-medium text-ink' : 'text-ink-3'} aria-current={last ? 'page' : undefined}>
                {crumb}
              </span>
            </Fragment>
          );
        })}
      </nav>
      {children && <div className="flex min-w-0 flex-1 justify-center px-6">{children}</div>}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-2xs text-ink-3">
          <span className="h-1.5 w-1.5 rounded-full bg-ok-dot" aria-hidden />
          CargoWise e-adapter
        </span>
        <span className="hidden h-4 w-px bg-line md:block lg:hidden" aria-hidden />
        <RouteStrip caption={null} className="hidden w-24 md:flex lg:hidden" />
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-2xs font-semibold text-ink-inverse lg:hidden"
          title={userEmail ?? undefined}
          aria-hidden
        >
          {(userEmail?.[0] ?? '?').toUpperCase()}
        </span>
      </div>
    </div>
  );
}
