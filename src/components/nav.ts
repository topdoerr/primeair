import type { ComponentType } from 'react';
import {
  OverviewIcon,
  PhoneIcon,
  PackageIcon,
  ReceiptIcon,
  BotIcon,
  TicketIcon,
  TrackingIcon,
  BookingIcon,
  type IconProps,
} from '@/components/icons';

export type NavItem = { href: string; label: string; Icon: ComponentType<IconProps> };
export type NavGroup = { label: string; items: NavItem[] };

// Shared by Sidebar and TopBar (breadcrumb). Routes are unchanged.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Logistics',
    items: [
      { href: '/', label: 'Overview', Icon: OverviewIcon },
      { href: '/tracking', label: 'Milestone tracking', Icon: TrackingIcon },
      { href: '/bookings', label: 'Bookings', Icon: BookingIcon },
      { href: '/awb', label: 'AWB lookup', Icon: PackageIcon },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/discrepancies', label: 'Discrepancies', Icon: ReceiptIcon },
      { href: '/tickets', label: 'Tickets', Icon: TicketIcon },
    ],
  },
  {
    label: 'Voice agent',
    items: [
      { href: '/calls', label: 'Calls', Icon: PhoneIcon },
      { href: '/assistant', label: 'Assistant', Icon: BotIcon },
    ],
  },
];

export function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/** Breadcrumb segments for a pathname: [group, page, detail?]. */
export function findCrumb(pathname: string): string[] | null {
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (isActive(item.href, pathname)) {
        const crumbs = [g.label, item.label];
        if (item.href !== '/' && pathname !== item.href) {
          crumbs.push(item.href === '/discrepancies' ? 'Report' : 'Detail');
        }
        return crumbs;
      }
    }
  }
  return null;
}
