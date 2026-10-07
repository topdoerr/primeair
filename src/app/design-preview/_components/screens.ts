// Dev-only design preview: the catalogue of screens the preview can render.
// Shared by the index page and the [screen] route so both stay in sync.

export const PREVIEW_SCREENS = [
  { key: 'overview', label: 'Overview', shell: true },
  { key: 'tracking', label: 'Milestone Tracking — all shipments', shell: true },
  { key: 'tracking-detail', label: 'Milestone Tracking — 810-21961306 detail', shell: true },
  { key: 'tracking-flight', label: 'Milestone Tracking — flight M68741', shell: true },
  { key: 'bookings', label: 'Bookings', shell: true },
  { key: 'awb', label: 'AWB Lookup — 810-21961413', shell: true },
  { key: 'awb-empty', label: 'AWB Lookup — no query', shell: true },
  { key: 'discrepancies', label: 'Discrepancy Reports', shell: true },
  { key: 'discrepancy-detail', label: 'Discrepancy Report — FLAGGED detail', shell: true },
  { key: 'tickets', label: 'Tickets', shell: true },
  { key: 'calls', label: 'Calls', shell: true },
  { key: 'assistant', label: 'Assistant', shell: true },
  { key: 'login', label: 'Login (full-bleed)', shell: false },
] as const;

export type PreviewScreenKey = (typeof PREVIEW_SCREENS)[number]['key'];

export function isPreviewScreen(key: string): key is PreviewScreenKey {
  return PREVIEW_SCREENS.some((s) => s.key === key);
}
