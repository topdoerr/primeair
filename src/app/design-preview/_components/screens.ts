// Dev-only design preview: the catalogue of screens the preview can render.
// Shared by the index page and the [screen] route so both stay in sync.
// `route` is the real dashboard path each screen mirrors; the shell uses it for
// the rail's active item and the top bar breadcrumb, exactly as production renders them.

export const PREVIEW_SCREENS = [
  { key: 'overview', label: 'Overview', shell: true, route: '/' },
  { key: 'tracking', label: 'Milestone Tracking — all shipments', shell: true, route: '/tracking' },
  {
    key: 'tracking-detail',
    label: 'Milestone Tracking — 810-21961306 detail',
    shell: true,
    route: '/tracking',
  },
  { key: 'tracking-flight', label: 'Milestone Tracking — flight M68741', shell: true, route: '/tracking' },
  { key: 'bookings', label: 'Bookings', shell: true, route: '/bookings' },
  { key: 'awb', label: 'AWB Lookup — 810-21961413', shell: true, route: '/awb' },
  { key: 'awb-empty', label: 'AWB Lookup — no query', shell: true, route: '/awb' },
  { key: 'discrepancies', label: 'Discrepancy Reports', shell: true, route: '/discrepancies' },
  {
    key: 'discrepancy-detail',
    label: 'Discrepancy Report — FLAGGED detail',
    shell: true,
    route: '/discrepancies/preview',
  },
  { key: 'tickets', label: 'Tickets', shell: true, route: '/tickets' },
  { key: 'calls', label: 'Calls', shell: true, route: '/calls' },
  { key: 'assistant', label: 'Assistant', shell: true, route: '/assistant' },
  { key: 'login', label: 'Login (full-bleed)', shell: false, route: '/login' },
] as const;

export type PreviewScreenKey = (typeof PREVIEW_SCREENS)[number]['key'];

export function isPreviewScreen(key: string): key is PreviewScreenKey {
  return PREVIEW_SCREENS.some((s) => s.key === key);
}
