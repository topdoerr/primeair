# Prime Air Ops Console: design system (final, implementation-ready)

Direction: **Precision Ops Console** (judge winner), with grafts the panel asked for: 14px body base, graphite sidebar as the shipped default with an inverse wordmark, asymmetric headline KPI, identifier-first rows, KeyValue total rows, finite ring pulse, honest integration label, drawer focus/scroll handling, global `accent-color`, stable scrollbar gutters, and a dashed MIA to SJU route strip used exactly twice.

Scope: visual and UX system only. Every route, data flow, form, action, env check and API call stays exactly as it is. No new npm dependencies. Tailwind 3.4 + `next/font/google` only. Icons are inline SVGs in `src/components/icons.tsx`. No emojis anywhere. Light theme with a dark graphite shell.

---

## 1. Design thesis

1. The dashboard is an **instrument panel, not a template**: one white operating panel floating on a cool canvas, a graphite rail beside it, hairlines instead of shadows, and nothing decorative.
2. **Two voices, not two sans faces**: Instrument Sans for everything a human reads, JetBrains Mono for everything a human scans (AWBs, flights, refs, kg, USD, counts, times), so columns line up like a cargo manifest.
3. **One accent, rationed**: cerulean appears only on the primary button, the focus ring, the in-progress milestone and the brand mark. Green survives only as the wordmark arrow and "done". Everything else is ink.
4. **Status is quiet until it is not**: a dot plus a sentence-case label in a hairline chip; a filled tier exists only for Flagged, Failed and High, so the eye stops only on exceptions.
5. **Density is deliberate and projector-safe**: 14px/20 UI base, 13px table cells, 44px rows, 32px controls, 20px rhythm between sections, edge-anchored at 1440 with a 1400px cap.

---

## 2. Typography

### 2.1 Fonts (`src/app/layout.tsx`)

```tsx
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';

const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

// <html lang="en" className={`${sans.variable} ${mono.variable}`}>
// <body className="min-h-screen bg-canvas font-sans text-sm text-ink-2 antialiased">
```

Both families are verified in `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`. Inter is removed. The old `--font-geist-sans` / `--font-geist-mono` variable names are deleted everywhere (`tailwind.config.ts` `fontFamily` switches to `var(--font-sans)` / `var(--font-mono)`).

`tailwind.config.ts`:

```ts
fontFamily: {
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
},
```

### 2.2 Type scale (Tailwind `fontSize` override, not extend)

| Token | Size / line-height | Tracking | Weight | Font | Role |
|---|---|---|---|---|---|
| `text-2xs` | 11px / 16px | +0.01em | 500 | Sans | Nav group labels, chip text, kbd, micro meta; the only uppercase style (see rule below) |
| `text-xs` | 12px / 16px | 0 | 400 / 500 | Sans | Labels, table heads, badges, hints, timestamps, meta rows, CardFooter |
| `text-sm` | 13px / 20px | 0 | 400 | Sans | Table cells, list rows, dense card content, buttons md |
| `text-base` | 14px / 20px | 0 | 400 | Sans | **UI default on `body`**, subtitles, form controls, prose, drawer body |
| `text-md` | 15px / 22px | -0.005em | 500 | Sans | Card titles when a card is the page's main object (rare) |
| `text-lg` | 17px / 24px | -0.01em | 600 | Sans | Mini-stat values in sans (unused by default; mono preferred) |
| `text-xl` | 20px / 28px | -0.015em | 600 | Sans | Login "Sign in" h1, login hero statement |
| `text-2xl` | 22px / 28px | -0.02em | 600 | Sans | Page h1 |
| `text-3xl` | 26px / 32px | -0.02em | 500 | **Mono** | Secondary KPI values |
| `text-4xl` | 32px / 36px | -0.025em | 500 | **Mono** | Login hero airport codes |
| `text-5xl` | 40px / 44px | -0.03em | 500 | **Mono** | Headline KPI value (first KPI cell) |
| `mono-cell` | 12.5px / 20px | -0.01em | 400 | Mono | Table identifier and numeric cells (`font-mono text-[12.5px]`) |
| `mono-inline` | 0.96em / inherit | -0.01em | 400 / 500 | Mono | `<Num>` / `<Id>` inside sans text |

```ts
fontSize: {
  '2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
  xs:    ['12px', { lineHeight: '16px' }],
  sm:    ['13px', { lineHeight: '20px' }],
  base:  ['14px', { lineHeight: '20px' }],
  md:    ['15px', { lineHeight: '22px', letterSpacing: '-0.005em' }],
  lg:    ['17px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
  xl:    ['20px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
  '2xl': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
  '3xl': ['26px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
  '4xl': ['32px', { lineHeight: '36px', letterSpacing: '-0.025em' }],
  '5xl': ['40px', { lineHeight: '44px', letterSpacing: '-0.03em' }],
},
```

### 2.3 Rules

- Weights: 400 body, 500 labels / links / badges / buttons / mono emphasis / KPI values, 600 headings and wordmark only. 700 is never used.
- Uppercase is allowed in exactly three places: the wordmark sub-line "GLOBAL LOGISTICS", airport codes (MIA, SJU), and nothing else. Table heads, labels, eyebrows, group labels and badges are sentence case.
- Every identifier and figure is mono: AWB numbers, flight codes, BK-/PA- numbers, CargoWise refs, Vapi ids, account codes, phone numbers, counts, pcs, kg, USD, percentages, durations, KPI values, timestamps inside tables, the route chip, transcript and XML blocks.
- Mono always carries `tracking-[-0.01em]` and sits 0.5px to 1px smaller than the surrounding sans.
- `tnum` is applied per utility, never globally, so proportional figures in prose stay natural:

```css
/* globals.css */
html {
  font-feature-settings: 'cv11', 'ss01', 'calt';
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.tnum { font-variant-numeric: tabular-nums; }
table, .font-mono { font-variant-numeric: tabular-nums; }
h1 { text-wrap: balance; }
p, .text-pretty { text-wrap: pretty; }
```

- Line-height: 16px for 11-12px, 20px for 13-14px, 1.2 for anything 20px and above.

---

## 3. Color tokens

All tokens are RGB triplets on `:root` and exposed in Tailwind as `rgb(var(--x) / <alpha-value>)` so `/50`-style opacity modifiers keep working. The existing `brand` and `accent` hex scales are kept verbatim.

### 3.1 `:root` block (`src/app/globals.css`)

```css
:root {
  /* Canvas and surfaces */
  --canvas: 244 245 247;          /* #f4f5f7 page background behind the panel */
  --surface: 255 255 255;         /* #ffffff panel, cards, table bodies, inputs, drawer */
  --surface-sunken: 248 249 251;  /* #f8f9fb table head, inset blocks, code, KPI footer */
  --surface-hover: 242 244 247;   /* #f2f4f7 row hover, ghost hover */
  --surface-active: 233 236 241;  /* #e9ecf1 pressed ghost, selected */
  --overlay: 12 17 23;            /* used as rgb(var(--overlay) / 0.32) drawer scrim */

  /* Lines (always 1px) */
  --line-subtle: 238 240 243;     /* #eef0f3 row dividers, list dividers, timeline rail */
  --line: 227 230 235;            /* #e3e6eb card and panel borders, table head bottom */
  --line-strong: 207 212 220;     /* #cfd4dc input borders, badge outline, empty meter cells */

  /* Text ramp (cool neutrals, not Tailwind slate) */
  --ink: 12 17 23;                /* #0c1117 headings, primary data, KPI values  16.9:1 */
  --ink-2: 59 68 81;              /* #3b4451 body, cells, labels                   9.6:1 */
  --ink-3: 102 112 133;           /* #667085 meta, table heads, hints              4.7:1 AA */
  --ink-4: 152 162 179;           /* #98a2b3 placeholders, disabled, decorative    3.0:1 never data */
  --ink-inverse: 255 255 255;

  /* Status tones: dot / fg / bg */
  --ok-dot: 92 185 72;      --ok-fg: 47 107 39;      --ok-bg: 238 248 234;
  --warn-dot: 217 154 30;   --warn-fg: 138 90 0;     --warn-bg: 253 246 231;
  --danger-dot: 224 73 59;  --danger-fg: 180 35 24;  --danger-bg: 253 242 241;
  --info-dot: 27 143 206;   --info-fg: 23 99 143;    --info-bg: 237 247 252;
  --neutral-dot: 154 163 178; --neutral-fg: 82 91 107; --neutral-bg: 241 243 246;

  /* Focus ring */
  --ring: 27 143 206;             /* brand-500 */

  /* Sidebar (graphite variant is the shipped default) */
  --sidebar-bg: 15 20 26;         /* #0f141a */
  --sidebar-fg: 255 255 255;      /* used at /55 for items, /80 on hover, /100 active */
  --sidebar-line: 255 255 255;    /* used at /8 for hairlines inside the rail */
  --sidebar-active: 255 255 255;  /* used at /8 for the active tint */
  --sidebar-hover: 255 255 255;   /* used at /5 */
}

/* Light sidebar variant (not shipped; token swap only) */
:root[data-sidebar="light"] {
  --sidebar-bg: 244 245 247;
  --sidebar-fg: 12 17 23;
  --sidebar-line: 227 230 235;
  --sidebar-active: 233 236 241;
  --sidebar-hover: 242 244 247;
}

html, body { background-color: rgb(var(--canvas)); color: rgb(var(--ink-2)); }

:focus-visible { outline: 2px solid rgb(var(--ring)); outline-offset: 2px; border-radius: inherit; }
::selection { background: #d3ecf8; color: #0c1117; }
:root { accent-color: rgb(var(--ring)); }   /* native audio, date picker, checkboxes pick up cerulean */

/* Overflow containers: drawer body, XML pre, table wrappers */
.scroll-stable { scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: rgb(var(--line-strong)) transparent; }
.scroll-stable::-webkit-scrollbar { width: 8px; height: 8px; }
.scroll-stable::-webkit-scrollbar-thumb { background: rgb(var(--line-strong)); border: 2px solid transparent; background-clip: padding-box; border-radius: 8px; }
```

Dead tokens removed: `--background`, `--foreground`, `--card`, `--card-foreground`, `--muted`, `--muted-foreground`, `--border`, `--primary`, `--primary-foreground`, `--accent-token`, `--sidebar`, `--sidebar-foreground`, `--radius`, and the `.mono-block` utility.

Grep-and-replace list: `bg-background` to `bg-canvas`; `bg-card` to `bg-surface`; `text-muted-foreground` to `text-ink-3`; `border-border` to `border-line`; `bg-muted` to `bg-surface-sunken`; `text-slate-900` to `text-ink`; `text-slate-700`/`600` to `text-ink-2`; `text-slate-500` to `text-ink-3`; `text-slate-400` to `text-ink-4`; `bg-slate-50` to `bg-surface-sunken`; `bg-slate-100` to `bg-surface-hover`; `border-slate-200` to `border-line`; `text-red-600` to `text-danger-fg`; `text-green-*`/`text-accent-700` success text to `text-ok-fg`; `rounded-xl`/`rounded-2xl` to `rounded-lg`/`rounded-xl` per section 4.

### 3.2 `tailwind.config.ts` colors block

```ts
colors: {
  canvas: 'rgb(var(--canvas) / <alpha-value>)',
  surface: {
    DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
    sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
    hover: 'rgb(var(--surface-hover) / <alpha-value>)',
    active: 'rgb(var(--surface-active) / <alpha-value>)',
  },
  overlay: 'rgb(var(--overlay) / <alpha-value>)',
  line: {
    DEFAULT: 'rgb(var(--line) / <alpha-value>)',
    subtle: 'rgb(var(--line-subtle) / <alpha-value>)',
    strong: 'rgb(var(--line-strong) / <alpha-value>)',
  },
  ink: {
    DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
    2: 'rgb(var(--ink-2) / <alpha-value>)',
    3: 'rgb(var(--ink-3) / <alpha-value>)',
    4: 'rgb(var(--ink-4) / <alpha-value>)',
    inverse: 'rgb(var(--ink-inverse) / <alpha-value>)',
  },
  ring: 'rgb(var(--ring) / <alpha-value>)',
  sidebar: {
    bg: 'rgb(var(--sidebar-bg) / <alpha-value>)',
    fg: 'rgb(var(--sidebar-fg) / <alpha-value>)',
    line: 'rgb(var(--sidebar-line) / <alpha-value>)',
    active: 'rgb(var(--sidebar-active) / <alpha-value>)',
    hover: 'rgb(var(--sidebar-hover) / <alpha-value>)',
  },
  ok:      { dot: 'rgb(var(--ok-dot) / <alpha-value>)',      fg: 'rgb(var(--ok-fg) / <alpha-value>)',      bg: 'rgb(var(--ok-bg) / <alpha-value>)' },
  warn:    { dot: 'rgb(var(--warn-dot) / <alpha-value>)',    fg: 'rgb(var(--warn-fg) / <alpha-value>)',    bg: 'rgb(var(--warn-bg) / <alpha-value>)' },
  danger:  { dot: 'rgb(var(--danger-dot) / <alpha-value>)',  fg: 'rgb(var(--danger-fg) / <alpha-value>)',  bg: 'rgb(var(--danger-bg) / <alpha-value>)' },
  info:    { dot: 'rgb(var(--info-dot) / <alpha-value>)',    fg: 'rgb(var(--info-fg) / <alpha-value>)',    bg: 'rgb(var(--info-bg) / <alpha-value>)' },
  neutral: { dot: 'rgb(var(--neutral-dot) / <alpha-value>)', fg: 'rgb(var(--neutral-fg) / <alpha-value>)', bg: 'rgb(var(--neutral-bg) / <alpha-value>)' },
  // Prime Global Logistics cerulean (kept verbatim)
  brand: { 50: '#edf7fc', 100: '#d3ecf8', 200: '#a9d9f0', 300: '#72c1e6', 400: '#38a6d8', 500: '#1b8fce', 600: '#1678af', 700: '#17638f', 800: '#1a5474', 900: '#133f57' },
  // Brand green (kept verbatim)
  accent: { 50: '#f1f9ec', 100: '#ddf0d0', 200: '#bfe3a9', 300: '#97d178', 400: '#74c257', 500: '#5cb948', 600: '#4c9e3a', 700: '#3c7d30', 800: '#336429', 900: '#2b5224' },
},
```

Keep Tailwind's default palette available (do not set `colors` at the top level; this goes under `theme.extend.colors`), but no page may use `slate-*`, `gray-*`, `sky-*`, `amber-*`, `red-*`, `green-*` after the pass. A grep for those is part of the checklist.

### 3.3 Usage rules

- `brand-600`: primary button fill, link hover color, globe ring in the mark. `brand-700`: primary hover, "In progress" timestamp text. `brand-500`: focus ring, in-progress milestone node and meter cell. `brand-800`: primary active. `brand-50`: nothing outside `info-bg`.
- `accent-500`: wordmark arrow, `ok-dot`, completed milestone node, completed meter cells. `accent-700`: never as text below `ok-fg`. Nothing else is green.
- Nav active state, links at rest, section titles, icons and KPI values are ink.
- `ink-4` is for placeholders, disabled text, and decorative icons only. It is non-AA by design so it cannot carry information.

### 3.4 STATUS map (replaces `BADGE_STYLES`)

```ts
type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';
export const STATUS: Record<string, { tone: Tone; label: string; emphasis?: 'filled' }> = {
  // ok (dot)
  RECONCILED: { tone: 'ok', label: 'Reconciled' },
  AVAILABLE: { tone: 'ok', label: 'Available' },
  COMPLETED: { tone: 'ok', label: 'Completed' },
  ACKNOWLEDGED: { tone: 'ok', label: 'Acknowledged' },
  CONFIRMED: { tone: 'ok', label: 'Confirmed' },
  SELF_SERVED: { tone: 'ok', label: 'Self-served' },
  // info (dot) = on plan / in motion
  ARRIVED: { tone: 'info', label: 'Arrived' },
  SCHEDULED: { tone: 'info', label: 'Scheduled' },
  IN_PROGRESS: { tone: 'info', label: 'In progress' },
  SENT: { tone: 'info', label: 'Sent' },
  VOICE_AGENT: { tone: 'info', label: 'Voice agent' },
  NORMAL: { tone: 'info', label: 'Normal' },
  // warn (dot) = needs a human eventually
  IN_TRANSIT: { tone: 'warn', label: 'In transit' },
  OPEN: { tone: 'warn', label: 'Open' },
  REQUESTED: { tone: 'warn', label: 'Requested' },
  ESCALATED: { tone: 'warn', label: 'Escalated' },
  TRANSFERRED: { tone: 'warn', label: 'Transferred' },
  // danger (FILLED) = exceptions only
  FLAGGED: { tone: 'danger', label: 'Flagged', emphasis: 'filled' },
  FAILED: { tone: 'danger', label: 'Failed', emphasis: 'filled' },
  HIGH: { tone: 'danger', label: 'High', emphasis: 'filled' },
  // neutral (dot)
  PICKED_UP: { tone: 'neutral', label: 'Picked up' },
  DASHBOARD: { tone: 'neutral', label: 'Dashboard' },
  CLOSED: { tone: 'neutral', label: 'Closed' },
  LOW: { tone: 'neutral', label: 'Low' },
  PENDING: { tone: 'neutral', label: 'Pending' },
  CANCELLED: { tone: 'neutral', label: 'Cancelled' },
  ABANDONED: { tone: 'neutral', label: 'Abandoned' },
};
// Lookup key is `String(value).toUpperCase()` so call outcomes such as 'self_served' resolve.
// Fallback: { tone: 'neutral', label: humanize(value) } where humanize = lower-case, '_' to ' ', first letter capitalised.
```

---

## 4. Surfaces and elevation

Principle: elevation is tone plus hairline. Only layers that physically float (drawer, popover) cast a shadow. Borders are always 1px.

### 4.1 Radii (`borderRadius` override)

```ts
borderRadius: {
  none: '0',
  sm: '4px',    // kbd, meter cells (2px via arbitrary), dot containers
  md: '6px',    // controls, inputs, badges, inset blocks, nav items
  lg: '8px',    // cards, table wrappers
  xl: '10px',   // the operating panel, drawer
  full: '9999px',
},
```

`rounded-2xl` no longer exists. `rounded-xl` is used only on the panel and the drawer.

### 4.2 Shadows (`boxShadow` extend)

```ts
boxShadow: {
  panel: '0 1px 2px rgba(12,17,23,0.04)',
  control: '0 1px 1px rgba(12,17,23,0.04)',
  'control-inset': 'inset 0 1px 1px rgba(12,17,23,0.03)',
  primary: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 1px rgba(12,17,23,0.08)',
  pop: '0 1px 2px rgba(12,17,23,0.06), 0 8px 24px -4px rgba(12,17,23,0.10)',
  drawer: '-12px 0 40px -8px rgba(12,17,23,0.18)',
  'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.6)',
  'row-rule': 'inset 2px 0 0 rgb(var(--ink))',
},
```

### 4.3 Surface ladder

| Layer | Recipe |
|---|---|
| Canvas | `bg-canvas`; holds the graphite rail and the panel |
| Operating panel | `rounded-xl border border-line bg-surface shadow-panel`, inset 8px top/right/bottom from the canvas; sidebar sits flush left |
| Card | `rounded-lg border border-line bg-surface` (no shadow; padding lives in CardHeader/CardBody) |
| Sunken block | `rounded-md border border-line-subtle bg-surface-sunken shadow-inset-top` (table head, charge summary, transcript, XML, parsed-summary band) |
| Table | wrapper `rounded-lg border border-line bg-surface overflow-x-auto scroll-stable`; thead `bg-surface-sunken`; th `border-b border-line`; tr `border-b border-line-subtle last:border-0`; hover `bg-surface-hover` + `shadow-row-rule` on linked rows |
| Raised (popover) | `rounded-lg border border-line bg-surface shadow-pop` |
| Drawer | `rounded-xl border border-line bg-surface shadow-drawer`; scrim `bg-overlay/30` |
| Primary button | flat `bg-brand-600` + `shadow-primary` (machined 1px inner highlight, no gradient) |

### 4.4 Gradients and noise

None in the app. No mesh, no grain, no glass. The single exception is the login hero pane:

```css
.login-hero {
  background-color: #0a0e14;
  background-image:
    radial-gradient(600px 400px at 20% 85%, rgba(27,143,206,0.16), transparent 70%),
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: auto, 32px 32px, 32px 32px;
  background-position: 0 0, -1px -1px, -1px -1px;
}
```

The graphite sidebar is a flat `bg-sidebar-bg`. The `backdrop-blur` on the top bar is the only filter; drop to solid `bg-surface` if screenshots show shimmer.

---

## 5. App shell

### 5.1 Layout (`src/app/(dashboard)/layout.tsx`)

```tsx
<div className="flex h-screen bg-canvas">
  <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm focus:text-ink focus:ring-2 focus:ring-ring">Skip to content</a>
  <Sidebar userEmail={user?.email} />
  <div className="flex min-w-0 flex-1 flex-col py-2 pr-2">
    <main id="main" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
      <TopBar />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-stable">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-5">{children}</div>
      </div>
    </main>
  </div>
</div>
```

`overflow-x-hidden` is removed from `<main>` so table wrappers can scroll horizontally. The panel scrolls; the sidebar is naturally sticky because the outer div is `h-screen`. Auth guard logic is unchanged.

### 5.2 Sidebar (`src/components/Sidebar.tsx`, client)

Container: `<aside className="flex w-[232px] shrink-0 flex-col bg-sidebar-bg px-3 pb-3 pt-3 md:w-14 lg:w-[232px]">`. No right border (the panel's border is the separator). Rail mode at md (768-1023px): width 56px, labels `hidden lg:inline`, items become 32x32 icon squares with `title={label}`, group labels `hidden lg:block`. Below md the rail is also used; a hamburger is not built.

Structure, top to bottom:

**1. Brand lockup** (`src/components/Brand.tsx`, `<BrandLockup size="sm" inverse />`), pure SVG plus text, no network:

```tsx
<Link href="/" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-sidebar-hover/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
    {/* globe: a single ring plus one meridian; equator removed so the mark reads at 22px */}
    <circle cx="11" cy="11" r="8.25" stroke="currentColor" strokeWidth="1.75" fill="none" className="text-sidebar-fg/90" />
    <ellipse cx="11" cy="11" rx="3.25" ry="8.25" stroke="currentColor" strokeWidth="1.25" fill="none" className="text-sidebar-fg/45" />
    {/* knockout then green arrow, bottom-right */}
    <path d="M11.5 15.5h7.5M15.5 12l3.5 3.5-3.5 3.5" stroke="rgb(var(--sidebar-bg))" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M11.5 15.5h7.5M15.5 12l3.5 3.5-3.5 3.5" stroke="#5cb948" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
  <span className="min-w-0 leading-none hidden lg:block">
    <span className="block text-[13.5px] font-semibold leading-4 tracking-[-0.01em] text-sidebar-fg">Prime Air</span>
    <span className="mt-0.5 block text-[9.5px] font-medium uppercase leading-3 tracking-[0.14em] text-sidebar-fg/55">Global Logistics</span>
  </span>
</Link>
```

Type carries the lockup; the mark is a supporting glyph. On light surfaces (`inverse` false) the ring is `brand-600`, the meridian `brand-600/45`, the knockout `rgb(var(--surface))`, text `ink` / `ink-3`. `logoSrc?` renders `<img onError={hide}>` only on login; the PNG is never rendered in the sidebar.

**2. Route strip** (`mt-3 mx-2`, `hidden lg:flex`), one of the two permitted uses of the dashed route motif:

```tsx
<div className="flex items-center gap-2 font-mono text-2xs text-sidebar-fg/70">
  <span>MIA</span>
  <span aria-hidden className="h-px flex-1 border-t border-dashed border-sidebar-line/25" />
  <span>SJU</span>
  <span className="ml-1 font-sans text-2xs text-sidebar-fg/45">Air cargo</span>
</div>
```

No status dot.

**3. Navigation** (`<nav aria-label="Main navigation" className="mt-5 flex-1 space-y-5">`), groups defined once in `src/components/nav.ts` and shared with TopBar:

| Group | Items (label, route, icon) |
|---|---|
| Logistics | Overview `/` OverviewIcon; Milestone tracking `/tracking` TrackingIcon; Bookings `/bookings` BookingIcon; AWB lookup `/awb` PackageIcon |
| Operations | Discrepancies `/discrepancies` ReceiptIcon; Tickets `/tickets` TicketIcon |
| Voice agent | Calls `/calls` PhoneIcon; Assistant `/assistant` BotIcon |

Group label: `mb-1 px-2 text-2xs font-medium text-sidebar-fg/40 hidden lg:block` (sentence case).

Item:

```
group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-fg/60
transition-colors duration-100 hover:bg-sidebar-hover/5 hover:text-sidebar-fg/90
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
md:justify-center md:px-0 lg:justify-start lg:px-2
```

Active: `bg-sidebar-active/8 text-sidebar-fg font-medium` plus a 2px rule `before:absolute before:left-[-12px] before:top-1.5 before:h-5 before:w-0.5 before:rounded-full before:bg-sidebar-fg` (white on graphite; ink on the light variant). Icon: `h-4 w-4 shrink-0 text-sidebar-fg/40 group-hover:text-sidebar-fg/80`, active `text-sidebar-fg` with `strokeWidth={1.75}` via prop. Active match: `href === '/' ? pathname === '/' : pathname.startsWith(href)` (unchanged).

**4. Footer** (`mt-auto space-y-2`):

User row `flex items-center gap-2.5 rounded-md px-2 py-1.5`: avatar `flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-fg text-2xs font-semibold text-sidebar-bg` (initial of email, `?` fallback); text block `min-w-0 hidden lg:block`: `truncate text-xs font-medium text-sidebar-fg` email with `title`, or "Not signed in"; `text-2xs text-sidebar-fg/45` "Operations".

Sign-out: the existing `<form action="/api/auth/signout" method="post">` is kept. At lg it renders a visible text button `h-7 rounded-md px-2 text-xs text-sidebar-fg/60 hover:bg-sidebar-hover/5 hover:text-sidebar-fg` "Sign out" on the right of the user row (`ml-auto`); in rail mode it is an icon-only `h-8 w-8` button with `LogOutIcon`, `aria-label="Sign out"` and `title="Sign out"`.

Powered-by lockup under a hairline:

```tsx
<div className="flex items-center gap-1.5 border-t border-sidebar-line/8 px-2 pt-2.5 text-2xs text-sidebar-fg/45 md:justify-center lg:justify-start">
  <span className="hidden lg:inline">Powered by</span>
  <OndaMark className="h-3 w-3 text-sidebar-fg/60" />
  <span className="hidden font-semibold tracking-[-0.01em] text-sidebar-fg/80 lg:inline">Onda</span>
</div>
```

The phrase "Powered by Onda" is kept verbatim; the "logistics AI" tail is dropped.

### 5.3 Top bar (`src/components/TopBar.tsx`, client, new)

```
sticky top-0 z-20 flex h-11 shrink-0 items-center justify-between border-b border-line bg-surface/85 px-6 backdrop-blur
```

Left: breadcrumb from `NAV` by pathname: `<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">` group name `text-ink-3`, `<ChevronRightIcon className="h-3 w-3 text-ink-4" />`, page label `font-medium text-ink`. `/discrepancies/[id]` falls back to "Operations / Discrepancies / Report" (no context plumbing).

Right (`flex items-center gap-3`): honest integration label `inline-flex items-center gap-1.5 text-2xs text-ink-3` with `h-1.5 w-1.5 rounded-full bg-ok-dot` + "CargoWise e-adapter" (static copy, no fake timestamp, no "Live data"); vertical hairline `h-4 w-px bg-line`; the route strip component (`hidden md:flex lg:hidden`, light variant); 24px avatar duplicate `lg:hidden`. No global search is added; a centered empty `children` slot is left for a future command palette.

---

## 6. Primitive components (`src/components/ui.tsx`, plus `form.tsx`, `table.tsx`, `Drawer.tsx`, `Brand.tsx`, `nav.ts`)

`cx(...classes)` is a tiny join helper. All class strings below are final.

### 6.1 PageHeader

```tsx
<PageHeader eyebrow? title subtitle? meta? action? />
<header className="mb-5 flex items-end justify-between gap-6">
  <div className="min-w-0">
    {eyebrow && <div className="mb-1.5 text-xs text-ink-3">{eyebrow}</div>}
    <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink text-balance">{title}</h1>
    {subtitle && <p className="mt-1 max-w-[64ch] text-base text-ink-3 text-pretty">{subtitle}</p>}
    {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3 [&_b]:font-medium [&_b]:text-ink-2">{meta}</div>}
  </div>
  {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
</header>
```

Eyebrow back link recipe: `<Link className="inline-flex items-center gap-1 rounded-sm hover:text-ink"><ArrowLeftIcon className="h-3 w-3" />Discrepancies</Link>`. Mono title variant for detail pages: pass `title={<Id className="text-2xl font-medium">…</Id>}`; the h1 keeps its classes and the Id overrides font. No bottom rule. Separator between meta chips is `<span aria-hidden className="h-0.5 w-0.5 rounded-full bg-line-strong" />`, never a typed middle dot.

### 6.2 Inline helpers

```tsx
<Num>   font-mono text-[0.96em] tracking-[-0.01em] tnum
<Id>    font-mono text-[0.96em] tracking-[-0.01em] text-ink
<Id link href>  + rounded-sm underline decoration-line-strong underline-offset-[3px] hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
<Null/> <span className="text-ink-4" aria-label="none">–</span>   (en dash)
<Kbd>   rounded-sm border border-line-strong bg-surface-sunken px-1 font-mono text-2xs text-ink-2
<Route from="MIA" to="SJU"/>  inline-flex items-center gap-1 font-mono text-[0.96em] tracking-[-0.01em] text-ink  with <ArrowRightIcon className="h-3 w-3 text-ink-4"/>
```

Links are ink with a hairline underline, never blue.

### 6.3 KPI strip (replaces `KpiCard`)

```tsx
<KpiStrip>  grid grid-cols-2 rounded-lg border border-line bg-surface divide-y divide-line lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:divide-y-0 lg:divide-x
<Kpi label value hint? icon? primary?>  px-5 py-4
  label  flex items-center gap-1.5 text-xs font-medium text-ink-3   (optional icon h-3.5 w-3.5 text-ink-4)
  value  mt-1.5 font-mono font-medium tracking-[-0.02em] text-ink tnum
         primary: text-5xl leading-[44px]   secondary: text-3xl leading-8
  hint   mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3
         segments: <span><Num className="text-ink-2">{n}</Num> in transit</span> separated by <span className="h-0.5 w-0.5 rounded-full bg-line-strong"/>
  delta? (optional) inline-flex items-center gap-1 font-mono text-xs tnum; tone ok/danger/neutral text colors; no arrows glyphs, use ArrowUpRightIcon/ArrowDownRightIcon 12px
```

The first cell is the headline: 1.6fr wide, 40px value. No hover, no top bar, no shadow. At `grid-cols-2` (below lg) the headline cell keeps `text-4xl`.

### 6.4 Card family

```
Card        rounded-lg border border-line bg-surface  + className
CardHeader  flex h-11 items-center justify-between gap-3 border-b border-line px-4
CardTitle   text-sm font-semibold tracking-[-0.01em] text-ink   (count slot: ml-2 font-mono text-xs font-normal text-ink-3)
CardBody    p-4   | dense: p-3 | flush: p-0 | roomy: p-5
CardFooter  border-t border-line px-4 py-2.5 text-xs text-ink-3
SectionLabel (SectionHeading)  mb-2 text-xs font-medium text-ink-3   (sentence case; optional right slot via flex items-center justify-between)
Divider     h-px w-full bg-line  | vertical: h-4 w-px bg-line
```

### 6.5 StatusBadge / Tag

```tsx
<StatusBadge status size?="md"|"sm" />
dot tier:    inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-1.5 text-xs font-medium text-ink-2
             + <span aria-hidden className={cx('h-1.5 w-1.5 rounded-full', `bg-${tone}-dot`)} />
filled tier: inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md border border-transparent bg-danger-bg px-1.5 text-xs font-medium text-danger-fg  + dot bg-danger-dot
size sm:     h-5 text-2xs px-1.5 gap-1
```

Tone classes must be written out (not template-built) so Tailwind sees them: `bg-ok-dot bg-warn-dot bg-danger-dot bg-info-dot bg-neutral-dot`.

Tone map for every status: see section 3.4. Source values (`VOICE_AGENT`, `DASHBOARD`) render through `<Tag>` in tables and through `StatusBadge` only when a column is explicitly "Status".

```tsx
<Tag size?>  inline-flex h-[22px] items-center rounded-md bg-surface-sunken px-1.5 text-xs font-medium text-ink-2   (sm: h-5 text-2xs)
```

`IntentBadge` is kept as an export name and renders `<Tag>` with the existing `INTENT_LABELS`; `null` renders "Unspecified" in `text-ink-3`. `Badge` is kept as an export name and renders `<StatusBadge>`.

### 6.6 Button

```
base   inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium
       transition-[background-color,border-color,color,box-shadow] duration-100
       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface
       disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress
sizes  sm: h-7 px-2.5 text-xs [&_svg]:h-3.5 [&_svg]:w-3.5
       md: h-8 px-3 text-sm [&_svg]:h-4 [&_svg]:w-4
       lg: h-9 px-3.5 text-sm [&_svg]:h-4 [&_svg]:w-4
       icon: w-8 px-0 (md) / w-7 px-0 (sm), requires aria-label
primary    bg-brand-600 text-ink-inverse shadow-primary hover:bg-brand-700 active:bg-brand-800
secondary  border border-line-strong bg-surface text-ink-2 shadow-control hover:bg-surface-hover hover:text-ink active:bg-surface-active
ghost      text-ink-2 hover:bg-surface-hover hover:text-ink
danger     bg-danger-fg text-ink-inverse hover:bg-[#9a1d13] active:bg-[#7f170f]
busy       sets aria-busy, swaps the leading icon for <Spinner className="animate-spin"/> (16px, stroke 2, 270deg arc), label becomes the verb-only form ("Pushing", "Syncing", "Creating", "Signing in"); no width measurement
<LinkButton href>  renders next/link with identical classes
```

### 6.7 Form (`src/components/form.tsx`)

```
Field     space-y-1.5
Label     block text-xs font-medium text-ink-2   optional: <span className="font-normal text-ink-4">(optional)</span>; htmlFor wired via useId
Help      text-xs text-ink-3
Error     text-xs text-danger-fg
control   block w-full rounded-md border border-line-strong bg-surface text-base text-ink placeholder:text-ink-4 shadow-control-inset
          transition-[border-color,box-shadow] duration-100 hover:border-ink-4
          focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-ring/25
          disabled:bg-surface-sunken disabled:text-ink-4 aria-[invalid=true]:border-danger-dot aria-[invalid=true]:ring-danger-dot/25
Input     control + md: h-8 px-2.5 text-sm | lg: h-9 px-3 text-base | xl (login): h-10 px-3 text-base
          mono variant: font-mono tracking-[-0.01em] placeholder:font-sans
          leading icon: wrapper relative; <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4"/> + pl-8
          suffix unit: pr-9 + <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-3">kg</span>
          type=date: control + [&::-webkit-calendar-picker-indicator]:opacity-60 (native picker retained; accent-color handles the calendar)
Select    control + appearance-none pr-8, absolute <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4"/>
Textarea  control minus height + py-2 leading-5 resize-y; mono variant: font-mono text-xs leading-[1.6]
```

Placeholders are hints ("e.g. 4"), never bare example values. Labels are sentence case.

### 6.8 Table (`src/components/table.tsx`)

```
Table     <div className="overflow-x-auto rounded-lg border border-line bg-surface scroll-stable"><table className="w-full border-collapse text-sm" style={{minWidth}}>
          minWidth per page: Overview snapshot none, Discrepancies 760, Calls 800, Tracking 960, Tickets 880, Bookings 920
THead     bg-surface-sunken
Th        h-9 whitespace-nowrap border-b border-line px-3 text-left text-xs font-medium text-ink-3 first:pl-4 last:pr-4   | align="right": text-right
TBody     (no class)
Tr        border-b border-line-subtle transition-colors duration-75 last:border-0 hover:bg-surface-hover
          href prop (stretched link): adds [&>td]:relative hover:shadow-row-rule; cell 1 renders
            <Link href className="after:absolute after:inset-0 after:content-['']">… </Link>  (relative is on the td, never on tr)
          onClick prop (Calls): adds cursor-pointer tabIndex={0} role="button" and Enter/Space handlers
Td        h-11 px-3 align-middle text-ink-2 first:pl-4 last:pr-4
          variants: mono    font-mono text-[12.5px] tracking-[-0.01em] text-ink
                    num     font-mono text-[12.5px] tracking-[-0.01em] text-right tnum text-ink
                    muted   text-ink-3
                    primary font-medium text-ink
          identifier cell (first column on every table): font-mono text-[12.5px] font-medium text-ink + for links: underline decoration-line-strong underline-offset-[3px] group-hover:decoration-ink
          two-line: <div className="text-ink">{primary}</div><div className="mt-0.5 text-xs text-ink-3">{secondary}</div>
Toolbar   mb-3 flex items-center justify-between gap-3; left: text-sm text-ink-3 with <Num className="text-ink">; status counts as <StatusBadge size="sm"/> + <Num>
Empty     <td colSpan> containing <EmptyState/> with py-12
```

The identifier cell is the strongest element in the row (mono 500 ink with a hairline underline that turns ink on hover), not the faintest.

### 6.9 Segments (ProgressBar)

```tsx
<Segments done total current? />
<div className="flex items-center gap-2">
  <div className="flex w-24 gap-[3px]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
    {cells: h-1.5 flex-1 rounded-[2px] bg-line
       done cells: bg-ink          (ink while in progress)
       all done (done === total): bg-ok-dot   (green reserved for complete)
       current cell (index === done when current): bg-brand-500 }
  </div>
  <span className="font-mono text-xs text-ink-2 tnum">{done}/{total}</span>
</div>
```

Used identically on Overview, the tracking table and the detail sync footer. Replaces every pill bar and the "72%" text.

### 6.10 Timeline step (`src/components/MilestoneTimeline.tsx`, same props)

```
<ol className="relative ml-1 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line-subtle">
<li className="relative flex gap-3 pb-5 last:pb-0">
  (completed and not last) after:absolute after:left-[7px] after:top-5 after:bottom-[-20px] after:w-px after:bg-ok-dot
  node  relative z-10 mt-[5px] h-[15px] w-[15px] shrink-0 rounded-full
        COMPLETED    bg-ok-dot text-ink-inverse flex items-center justify-center  + <CheckIcon width=9 height=9 strokeWidth=2.5/>
        IN_PROGRESS  bg-brand-500 animate-pulse-ring   (finite: 3 iterations, then rests with a static 15% ring)
        PENDING      border border-line-strong bg-surface
  content  grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-4 gap-y-0.5
    row1 col1: <span className="mr-2 hidden font-mono text-2xs text-ink-4 lg:inline">01</span> + label text-sm font-medium text-ink  (pending: font-normal text-ink-3)
    row1 col2: font-mono text-xs text-ink-3 tnum text-right whitespace-nowrap  'Oct 7, 3:45 PM' | 'In progress' text-brand-700 | 'Expected' text-ink-4
    row2 col1: text-xs text-ink-3 notes + <Tag size="sm">via portal</Tag>
    row2 col2: font-mono text-2xs text-ink-4 '+2h 14m' elapsed since previous completed step when both timestamps exist
```

Step numbers are zero-padded 01-06.

### 6.11 EmptyState

```tsx
<EmptyState icon? title description? action? size?="md"|"sm" />
flex flex-col items-center justify-center py-12 text-center   (sm: py-8)
icon box   mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-sunken text-ink-4   (16px icon)
title      text-sm font-medium text-ink
desc       mt-1 max-w-[40ch] text-xs text-ink-3
action     mt-4   (secondary sm button or LinkButton)
```

### 6.12 InlineNotice

```
inline-flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs animate-fade-in
ok       border-ok-bg bg-ok-bg text-ok-fg         role="status"   icon CheckCircleIcon 14px
danger   border-danger-bg bg-danger-bg text-danger-fg  role="alert"  icon AlertIcon 14px
neutral  border-line bg-surface-sunken text-ink-2   role="status"   icon none
```

Replaces every bare red/green result string (TrackingActions, BookingForm, CallsTable sync, AssistantEditor, login error).

### 6.13 KeyValue (description lists)

```tsx
<KeyValue rows columns?=1|2 />
columns 1:  <dl className="divide-y divide-line-subtle">
            row  grid grid-cols-[120px_1fr] items-center gap-3 py-2 text-sm first:pt-0 last:pb-0
            dt   text-ink-3      dd  min-w-0 truncate text-ink   (mono via <Id>/<Num>, badges left-aligned)
columns 2:  <dl className="grid grid-cols-2 gap-x-6 gap-y-3">  (no dividers)
            dt   text-xs text-ink-3    dd  mt-0.5 text-sm text-ink
row.total:  border-t border-line pt-3 mt-1; dd font-mono text-lg font-medium tnum text-ink
```

Ledger variant `<LedgerRow label value strong?>`: `flex items-baseline justify-between py-1.5 text-sm`, label `text-ink-3`, value `font-mono tnum text-ink`; `strong` (Total collect) = the `total` treatment above. `Spec`, `Facts` and `Fact` are thin aliases over KeyValue so existing names can be kept if used.

### 6.14 Drawer (`src/components/Drawer.tsx`, client)

```
root   fixed inset-0 z-40
scrim  absolute inset-0 bg-overlay/30 animate-fade-in   (click closes)
panel  absolute inset-y-2 right-2 flex w-full max-w-[520px] flex-col rounded-xl border border-line bg-surface shadow-drawer animate-slide-in-right
       role="dialog" aria-modal="true" aria-labelledby={titleId}
header flex h-12 shrink-0 items-center justify-between border-b border-line px-5
       title text-sm font-semibold text-ink (id=titleId) + subtitle text-xs text-ink-3; close = Button ghost icon sm with CloseIcon, aria-label="Close", autoFocus
body   flex-1 overflow-y-auto scroll-stable; sections px-5 py-4 border-b border-line-subtle last:border-0 with <SectionLabel>
```

Behaviour: Escape closes; body gets `overflow: hidden` while open and restores on close; focus returns to the element that opened it (the row) on close; Tab is wrapped inside the panel with a minimal keydown handler (first/last focusable), no dependency.

### 6.15 MonoBlock

```
wrapper  rounded-md border border-line-subtle bg-surface-sunken shadow-inset-top overflow-hidden
header?  flex h-8 items-center justify-between border-b border-line-subtle px-3 text-2xs text-ink-3   (label left, e.g. "XML payload"; right: <Num>{bytes}</Num> bytes)
pre      max-h-[28rem] overflow-auto scroll-stable p-4 font-mono text-xs leading-[1.6] text-ink-2 whitespace-pre-wrap break-words
```

### 6.16 Icons (`src/components/icons.tsx`)

`base()` becomes `width 16, height 16, strokeWidth 1.5`, keeps `viewBox 0 0 24 24`, round caps/joins, `aria-hidden` default true (overridden when `aria-label` is passed). Every existing export name is kept. Redraws: `BotIcon` becomes a voice waveform (five vertical rounded bars, heights 6/12/16/10/5 centred on y=12); `TrackingIcon` becomes a route arc (2.5r circles at (5,18) and (19,6) joined by a quadratic arc); `OverviewIcon` becomes a calm 2x2 grid of equal 7x7 rounded squares; `PlayIcon` becomes `fill="currentColor" stroke="none"`. New exports: `SearchIcon`, `ChevronDownIcon`, `ChevronRightIcon`, `ArrowRightIcon`, `ArrowLeftIcon`, `ArrowUpRightIcon`, `ArrowDownRightIcon`, `LogOutIcon`, `Spinner`, `AlertIcon`, `CheckCircleIcon`, `ArrowDownToLineIcon` (portal pull), `ArrowUpFromLineIcon` (CargoWise push), `InboxIcon`, `OndaMark` (three stacked 12px arcs, strokeWidth 1.5).

---

## 7. Page-by-page composition

Common to every page: subtitles are sentence-case product copy without arrows or em dashes; all enums through `StatusBadge`; all IDs and figures through `Id`/`Num`; tables through the Table primitives; empty states through `EmptyState`; "help paragraph" cards removed and their copy moved into `CardFooter` or an empty state. Vertical rhythm between sections is 20px (`gap-5`, `mt-5`); 12px inside cards.

### 7.1 Overview `/` (`OverviewView.tsx`)

- PageHeader: "Overview"; subtitle "Milestone tracking, CargoWise sync, bookings and the voice agent at a glance."; meta `<Num>{awbs.length}</Num> shipments` / `<Num>{inTransit}</Num> in transit` / `Today <Num>{weekday, MMM d}</Num>` (static render date, no data change).
- KpiStrip (headline first): **Shipments tracked** (primary, 40px) hint `{inTransit} in transit / {arrived} arrived / {available} available`; **In transit** hint "MIA to SJU, milestones updating"; **CargoWise syncs today** hint `{pushesAck} acknowledged via e-adapter`; **Bookings, 7 days** hint `{confirmed} confirmed in CargoWise`.
- Band `mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`.
  - Left Card "Milestone snapshot" (count `<Num>{n}</Num>`; right `LinkButton ghost sm` "Open tracking" + ArrowUpRightIcon). CardBody flush: table without thead, rows `Tr href=/tracking?q={awb}`: Td identifier AWB; Td muted `flex gap-2`: flight `<Id>` + commodity sans; Td: StatusBadge + `text-ink-2` milestone label, or `text-ink-3` "Not started"; Td right: `<Segments done total current>`. Empty: EmptyState "No shipments tracked yet" / "Shipments appear here once a flight or air waybill is tracked."
  - Right column: Card "Recent bookings" (count; "View all" ghost link). CardBody flush `ul divide-y divide-line-subtle`, li `px-4 py-2.5`: row 1 `flex items-center justify-between` customer `text-sm font-medium text-ink` + `StatusBadge size=sm`; row 2 `mt-0.5 flex gap-x-2 text-xs text-ink-3`: `<Id>BK-0004</Id>`, commodity ?? "Cargo", `ready <Num>Oct 8</Num>`; row 3 only when cargowise_ref or voice: `<Id>` ref and `<Tag size=sm>Voice agent</Tag>`. Empty: EmptyState sm "No bookings in the last 7 days". Then `mt-5` Card "Voice agent today": CardBody `grid grid-cols-3 divide-x divide-line` cells `px-4 py-3`: label `text-xs text-ink-3` + value `mt-1 font-mono text-lg font-medium text-ink tnum` for Calls, Self-served `{pct}%`, Top intent `<Tag>` or `<Null/>`; CardFooter right-aligned ghost "View calls".
- Replaces: four identical hover-lift KPI cards with a blue top bar (now one bordered strip with a headline cell), uppercase KPI labels, middle-dot prose metadata, grey booking tiles, pill progress bars.

### 7.2 Milestone tracking `/tracking` (list) (`TrackingView.tsx`)

- PageHeader "Milestone tracking"; subtitle "Flight or air waybill milestones from the cargo portal, synced to CargoWise through the e-adapter."; action slot = the GET form: Input md mono with SearchIcon `w-[320px]` placeholder "AWB 810-21961413 or flight M68741" `aria-label="Track a shipment"`, Button primary md "Track", and `LinkButton ghost md href=/tracking` "Clear" when `q`.
- Toolbar: `<Num>{n}</Num> tracked shipments` or `Flight <Id>M68741</Id>` / `<Num>{n}</Num> shipments`.
- Table (min 960): AWB (identifier, row href to detail), Flight (mono muted), Commodity, Current milestone (StatusBadge + label), Progress (Segments), CargoWise (two-line `<Id>` ref over `font-mono text-xs text-ink-3 tnum` time, else `text-ink-3` "Not pushed"), Status (StatusBadge). CardFooter on the wrapper: "Open a shipment for the full timeline, portal pull and CargoWise push. Searching a flight lists every shipment on it."
- Empty: EmptyState PackageIcon "No shipments tracked yet" / "Search an air waybill or flight number to start tracking." Not-found: EmptyState SearchIcon `Nothing tracked for <Id>{q}</Id>` / "Try an air waybill such as 810-21961413 or a flight such as M68741." action secondary sm "Clear search".

### 7.3 Milestone tracking detail (same route, one AWB)

- PageHeader eyebrow back link "Milestone tracking"; title `<Id>{master_bill_number}</Id>` at h1 size with StatusBadge beside it (`flex items-center gap-3`); meta chips `<Route from="MIA" to="SJU"/>`, `Flight <Id>M68741</Id>`, commodity ?? "Cargo", `Current: <b>{label ?? 'Not started'}</b>`; action = `<TrackingActions/>`: Button secondary md ArrowDownToLineIcon "Pull from portal" (busy "Checking portal"), Button primary md ArrowUpFromLineIcon "Push to CargoWise" (busy "Pushing"); result renders as `InlineNotice` on its own line `mt-3` under the meta row; auto-clears on the next action. Both buttons use the Spinner.
- Grid `grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`. Left Card "Milestones" count `<Num>{done}</Num>/<Num>6</Num> complete`, CardBody `p-5` with MilestoneTimeline. Right: Card "CargoWise sync" CardBody KeyValue rows Status (StatusBadge), Reference (`<Id>`), Last push (`<Num>` time), Via (text), then a `total` row "Pushed" with `<Segments>` as the value; not pushed: EmptyState sm ArrowUpFromLineIcon "Not pushed yet" / "Push to CargoWise sends the milestones through the e-adapter." Card "Integration log" CardBody flush `ul divide-y divide-line-subtle`, li `flex gap-3 px-4 py-2.5`: direction icon in `mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-surface-sunken text-ink-3` (ArrowDownToLine for PORTAL_PULL, ArrowUpFromLine for CARGOWISE_PUSH); text: row 1 `flex justify-between` kind `text-sm text-ink` + StatusBadge sm; row 2 `font-mono text-xs text-ink-3 tnum` time + `<Id>` external_ref; row 3 `text-xs text-ink-3` summary. Max 8 rows as today. Empty: EmptyState sm "No integration activity".
- Replaces: AWB as a `text-lg` line inside a card under a generic title (now the mono h1), `animate-ping` node, 2px connector and `ring-4 ring-white` knockouts, "72%" pill bar.

### 7.4 Bookings `/bookings` (`BookingsView.tsx`, `BookingForm.tsx`)

- PageHeader "Bookings"; subtitle "Recurring clients book here or through the voice agent; each booking is created in CargoWise via the e-adapter."
- Layout `grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]`.
- Left: Toolbar `<Num>{n}</Num> bookings` + `<StatusBadge size=sm status="CONFIRMED"/> <Num>{confirmed}</Num>`. Table (min 920): # (`<Id>BK-0001</Id>` identifier), Client (primary; second line `text-xs text-ink-3`: `<Route/>` + `<Id>` flight), Commodity (text or Null), Pieces (num right), Weight kg (num right, `toLocaleString`), Ready (`<Num>` date), Status (StatusBadge), CargoWise (`<Id>` or `text-ink-3` "Pending"), Source (`<Tag>` Voice agent / Dashboard), Created (`font-mono text-xs text-ink-3 tnum`). Empty: EmptyState BookingIcon "No bookings yet" / "Create one for a recurring client using the form."
- Right: Card "New booking" CardBody BookingForm; CardFooter "Confirms the booking and creates it in CargoWise through the e-adapter." Form `space-y-4` with `<Divider/>` between Client / Shipment / Schedule: Select lg Client (option text `{name}  {account_code}`), Input lg Commodity (placeholder "e.g. Fresh cut flowers"), `grid grid-cols-2 gap-3` Pieces (number, "e.g. 4") and Weight (number, suffix kg), Input lg date Ready date, Input lg Notes (optional, "e.g. Keep in cooler, 2 to 8 C"); action row `flex items-center justify-between pt-1` Button primary lg "Create booking" (busy "Creating"); InlineNotice `mt-3`. All labels `htmlFor` via `useId`.
- Card "Recurring clients" `mt-5` (count): CardBody flush `grid sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-line-subtle` cells `px-4 py-3`: name `text-sm font-medium text-ink`; `mt-0.5 flex gap-x-2 text-xs text-ink-3`: `<Id>{account_code}</Id>` + default_commodity; `mt-1 text-xs text-ink-3` contact + `<Num>` phone.
- Replaces: pcs/kg in a grey sub-line (now real numeric columns), grey client tiles, positional copy ("use the form on the right").

### 7.5 AWB lookup `/awb` (`AwbLookupView.tsx`)

- PageHeader "AWB lookup"; subtitle "Search a master air waybill to review the record and charge reconciliation."; action = form: Input md mono + SearchIcon `w-[280px]` placeholder "e.g. 810-21961413", Button primary md "Search".
- Not found: EmptyState SearchIcon `No air waybill found for <Id>{q}</Id>` / "Try 810-21961413 or 810-21961306."
- Result `grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`. Left Card: CardHeader title `<Id className="text-base font-medium">{master_bill_number}</Id>` + commodity `text-xs text-ink-3`, right StatusBadge; CardBody KeyValue columns=2: Carrier (`<Id>`), Flight (`<Id>`), Origin, Destination (codes mono), Cargo ready (`<Num>` "MMM d, h:mm a" or `text-ink-3` "Not yet"), Available for pickup (StatusBadge-style dotted "Yes" ok / "No" neutral). Right Card "Charge breakdown" CardHeader with StatusBadge(recon.status) (FLAGGED filled); CardBody LedgerRow Weight charge, Other charges, Total collect (total row, `text-lg` mono); CardFooter sunken block `rounded-md bg-surface-sunken p-3`: `flex justify-between text-xs text-ink-3` "Expected (weight + other)" / `<Num>`; `mt-1.5` InlineNotice danger `Difference <Num>{delta}</Num>, flagged for review` or ok "Matches total collect". Below grid `mt-4` LinkButton ghost sm "View related discrepancy reports" + ArrowUpRightIcon.

### 7.6 Discrepancies `/discrepancies` (`DiscrepanciesView.tsx`)

- PageHeader "Discrepancies"; subtitle "Invoice reconciliation output, flagged when weight charge plus surcharges does not equal total collect."
- Toolbar `<Num>{n}</Num> reports` + `<StatusBadge size=sm status="FLAGGED"/> <Num>{flagged}</Num>` (derived count).
- Table (min 760): Message ID (identifier, row href to detail), Carrier (`<Id>`), Invoice (`<Id>` or Null), AWB (`<Id>` or Null), Status (StatusBadge), trailing `<ChevronRightIcon className="h-4 w-4 text-ink-4"/>` right-aligned (replaces "View →"). Empty: EmptyState ReceiptIcon "No discrepancy reports" / "Reports are generated when a carrier invoice does not reconcile."

### 7.7 Discrepancy detail `/discrepancies/[id]`

- PageHeader eyebrow back link "Discrepancies"; title `<Id>` message_id at h1; meta chips `Carrier <Id>`, `Invoice <Id>` (if any); action StatusBadge (filled when FLAGGED).
- Grid `grid gap-5 lg:grid-cols-2`. Left Card "Parsed summary": CardBody KeyValue columns=2 Master bill, Flight, Route (`<Route/>` from parsed codes), Commodity; `<SectionLabel className="mt-5">Charges</SectionLabel>`; LedgerRow Weight charge / Other charges / Total collect (total); verdict block `mt-4 rounded-md border p-3 text-xs` FLAGGED `border-danger-bg bg-danger-bg text-danger-fg` else `border-ok-bg bg-ok-bg text-ok-fg`, inside `grid grid-cols-3 gap-3` Expected / Computed / Difference each `font-mono tnum`, reason `mt-2 font-medium`. Right Card "DiscrepancyReport XML": CardHeader with secondary sm "Copy" (client, `navigator.clipboard`, optional); CardBody flush MonoBlock with header strip "XML payload" left and `<Num>{byteLength}</Num> bytes` right.
- Replaces: the near-black terminal block (now a sunken typeset inset).

### 7.8 Tickets `/tickets`

- PageHeader "Tickets"; subtitle "Created automatically after every call for follow-up by the ops team."
- Toolbar `<Num>{n}</Num> tickets` + `<StatusBadge size=sm status="OPEN"/> <Num>{open}</Num>`.
- Table (min 880): # (`<Id>PA-0001</Id>` identifier), Subject (primary; description `mt-0.5 max-w-[48ch] text-xs text-ink-3 line-clamp-1`), Type (`<Tag>`), AWB (`<Id link href=/awb?q=>` or Null), Priority (StatusBadge: HIGH filled, NORMAL info, LOW neutral), Status (OPEN warn, CLOSED neutral), Created (`font-mono text-xs text-ink-3 tnum`). CardFooter: "Tickets are created when a call ends and when you run Sync calls. Self-served calls open as Low and close; pickups and invoice questions stay Open." with inline `StatusBadge size=sm` chips. Empty: EmptyState TicketIcon "No tickets yet" / "One is created automatically after each call."

### 7.9 Calls `/calls` (`CallsTable.tsx`)

- PageHeader "Calls"; subtitle "Inbound calls handled by the bilingual voice agent."; action slot = CallsTable's sync control: `flex items-center gap-3` InlineNotice neutral/danger (sync message) + Button secondary md SyncIcon "Sync calls" (busy "Syncing").
- Table (min 800; rows `onClick`, `tabIndex=0`, Enter/Space open the drawer, `cursor-pointer`): Started (`font-mono text-xs text-ink-2 tnum`), Caller (`<Num>` phone or Null), Intent (`<Tag>`), AWB (`<Id>` or Null), Duration (num right "4m 12s" + 12px filled PlayIcon `ml-1.5 text-ink-3` with `title="Recording available"` when recording_url), Outcome (StatusBadge via upper-cased key; unknown values fall back). Empty: EmptyState PhoneIcon "No calls yet" / "Sync calls pulls the latest from Vapi." action secondary sm "Sync calls".
- Drawer: title "Call detail", subtitle caller phone mono or "Unknown caller". Section 1 KeyValue columns=2: Started, Duration, Intent (Tag), Outcome (StatusBadge), Referenced AWB (`<Id link>`), Vapi call id (`<Id className="break-all text-xs text-ink-3">`). Section 2 SectionLabel "Recording": `<audio controls preload="none" className="h-9 w-full">` inside `rounded-md border border-line bg-surface-sunken p-2` (cerulean via `accent-color`), or EmptyState sm "No recording for this call". Section 3 (flex-1) SectionLabel "Transcript": MonoBlock; lines starting with `AI:`, `Assistant:`, `User:`, `Caller:` get the speaker prefix in `font-medium text-ink` (presentational split only; raw text fallback).
- Replaces: ad hoc drawer markup (now `Drawer` with Escape, scroll lock, focus return), dark transcript block.

### 7.10 Assistant `/assistant` (`AssistantEditor.tsx`)

- PageHeader "Assistant"; subtitle "Live Vapi configuration for the voice agent; edits push back through the Vapi MCP server."
- Not configured / no assistant / error: Card containing EmptyState AlertIcon with titles "Vapi is not configured" / "No assistant found" / "Could not reach Vapi", descriptions using `<Kbd>VAPI_API_KEY</Kbd>` and `<Kbd>npm run vapi:provision</Kbd>`; the error text in an InlineNotice danger.
- Grid `grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]`. Left Card: CardHeader assistant.name + `inline-flex items-center gap-1.5 text-2xs text-ink-3` with `bg-ok-dot` dot "Live"; CardBody KeyValue: Assistant ID (`<Id className="break-all text-xs">`), Phone number (`<Num>` or `text-ink-3` "None attached"), Model (`<Tag>{provider}</Tag>` + `<Id>{model}</Id>`). Right Card "Prompts": CardHeader right slot dirty indicator `inline-flex items-center gap-1.5 text-xs text-ink-3` with `bg-warn-dot` dot "Unsaved changes" (only when dirty); CardBody Field "First message" Textarea lg rows 3 + help "Spoken when the assistant answers a call."; Field "System prompt" Textarea mono rows 14; CardFooter `flex items-center justify-between`: InlineNotice result left, Button primary md "Push changes" right (busy "Pushing"; disabled when not dirty). Success copy unchanged.

---

## 8. Login (`src/app/login/page.tsx`)

Does not depend on the hotlinked PNG or hero image. All behaviour (redirectTo, env checks, error fallbacks, `router.push` / `router.refresh`) is unchanged.

```
<div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
  LEFT (hidden lg:flex)  relative flex-col justify-between overflow-hidden p-12 text-white login-hero
    optional photo: <img src={hero} onError={e => (e.currentTarget.style.display = 'none')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" />
                    under a scrim <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/70 to-[#0a0e14]/30" />
    top     <BrandLockup size="lg" inverse />  (mark 32px; "Prime Air" text-lg font-semibold tracking-[-0.01em]; "GLOBAL LOGISTICS" text-[10px] tracking-[0.14em] text-white/60)
    middle  route diagram (second and last use of the dashed motif)
            <div className="relative mt-16 flex items-center gap-6 font-mono">
              <div><div className="text-4xl tracking-[-0.025em]">MIA</div><div className="mt-1 font-sans text-xs text-white/50">Miami</div></div>
              <div className="relative h-px flex-1 border-t border-dashed border-white/25">
                <span className="absolute left-[60%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white" />
                <ArrowRightIcon className="absolute -right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5cb948]" />
              </div>
              <div><div className="text-4xl tracking-[-0.025em]">SJU</div><div className="mt-1 font-sans text-xs text-white/50">San Juan</div></div>
            </div>
            <p className="mt-10 max-w-[36ch] text-xl font-semibold tracking-[-0.015em] text-balance">Air cargo operations, answered on the first ring.</p>
            <p className="mt-3 max-w-[44ch] text-base text-white/60 text-pretty">AWB status, pickups and discrepancies for the Miami to San Juan lane.</p>
    bottom  <div className="flex items-center gap-1.5 text-xs text-white/50">Powered by <OndaMark className="h-3 w-3 text-white/70"/> <span className="font-semibold text-white/80">Onda</span></div>
  RIGHT  flex items-center justify-center bg-canvas px-6
    <div className="w-full max-w-[360px]">   (no card; the form sits on canvas)
      <BrandLockup size="sm" className="mb-8 lg:hidden" />
      <h1 className="text-xl font-semibold tracking-[-0.015em] text-ink">Sign in</h1>
      <p className="mt-1 text-base text-ink-3">Cargo operations dashboard</p>
      <form className="mt-8 space-y-4">
        Field Email    Input xl type=email autoComplete=email placeholder="you@primeair.example"
        Field Password Input xl type=password autoComplete=current-password
        error → <InlineNotice tone="danger" className="w-full">…</InlineNotice>
        <Button variant="primary" className="h-10 w-full text-base" busy={loading}>Sign in</Button>  (busy "Signing in")
      </form>
      <p className="mt-6 text-xs text-ink-3">Access is provisioned by Prime Air operations.</p>
    </div>
</div>
```

With no network the left pane is a clean ink surface with the hairline grid, the lockup, the route diagram and the statement; nothing is broken.

---

## 9. Motion and interaction

```ts
// tailwind.config.ts
transitionTimingFunction: { out: 'cubic-bezier(.2,.8,.2,1)' },
transitionDuration: { 75: '75ms', 100: '100ms', 160: '160ms', 200: '200ms' },
keyframes: {
  'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
  'slide-in-right': { from: { opacity: '0', transform: 'translateX(12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
  'pulse-ring': { '0%, 100%': { boxShadow: '0 0 0 4px rgb(var(--ring) / 0.15)' }, '50%': { boxShadow: '0 0 0 6px rgb(var(--ring) / 0.35)' } },
  spin: { to: { transform: 'rotate(360deg)' } },
},
animation: {
  'fade-in': 'fade-in 160ms cubic-bezier(.2,.8,.2,1) both',
  'slide-in-right': 'slide-in-right 200ms cubic-bezier(.2,.8,.2,1) both',
  'pulse-ring': 'pulse-ring 2.4s ease-in-out 3 both',   // finite: settles after 3 cycles at the 15% ring
  spin: 'spin 700ms linear infinite',
},
```

Rules:

- Color, background and border transitions: 100ms ease-out (rows 75ms). Transform and opacity: 160-200ms `ease-out`. Nothing animates on scroll. No hover lift, no shadow growth, no decorative reveals, no page-entry animation.
- Hover: rows `bg-surface-hover` plus the inset ink rule on linked rows; ghost buttons tint; links switch underline from `line-strong` to ink; nav icons brighten one step.
- Pressed: buttons darken one step, no scale.
- Focus: global `:focus-visible` 2px `ring` outline with 2px offset; inputs use the ring recipe; the drawer close button autofocuses and focus returns to the originating row on close; Escape closes.
- Loading: buttons set `aria-busy`, show the 16px Spinner in place of their icon with a verb-only label; the sibling button in a pair is disabled at 50% opacity. Optional `loading.tsx` per route: three `h-4 rounded-sm bg-surface-sunken animate-pulse` bars inside a Table wrapper.
- `InlineNotice` fades in (160ms) on action results.
- Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .animate-spin { animation-duration: 700ms !important; animation-iteration-count: infinite !important; }
}
```

- Hit sizes: every interactive control is at least 28px tall (sm buttons) and 32px in the sidebar; icon-only buttons are 28x28 or 32x32 with `aria-label`.

---

## 10. Do / Don't

**Do**

- Set every identifier and figure in JetBrains Mono with `tracking-[-0.01em]`; right-align numeric columns.
- Make the identifier cell the strongest element in every row (mono 500 ink, hairline underline).
- Use one hairline (1px) for every border and divider; tone, not shadow, for depth.
- Use `StatusBadge` for every enum and `Tag` for categories; keep the filled tier for Flagged, Failed, High only.
- Use `Segments` wherever progress is shown; ink while in progress, green only at 6/6.
- Keep cerulean for the primary button, the focus ring, the in-progress milestone and the brand mark.
- Write sentence-case copy without arrows, em dashes or middle dots in UI text; use `Route` and the dot separator instead.
- Use `EmptyState` with icon, title, one sentence and an action for every empty and not-found state.
- Use `InlineNotice` for every action result.
- Keep a visible "Sign out" text button in the expanded sidebar.
- Keep "Powered by Onda" verbatim with the OndaMark.

**Don't**

- No Inter, no Tailwind slate/gray/sky/amber/red/green utilities, no `rounded-xl` on cards, no `rounded-2xl`, no `rounded-full` badges.
- No resting shadows on cards, tables or KPI cells; no hover shadow growth; no blue top bars on cards.
- No uppercase tracked labels except the wordmark sub-line and airport codes.
- No gradient mesh, noise, glass or blur beyond the top bar's `backdrop-blur`.
- No infinite pulses or pings; no `animate-ping`.
- No "Live data" or fabricated timestamps; the integration label is static copy.
- No dark terminal blocks for transcripts or XML.
- No typed arrows ("→", "←") or "View →" links; use icons.
- No emojis, no icon libraries, no new npm dependencies, no external CSS or JS.
- No `position: relative` on `<tr>`; stretched links use `[&>td]:relative`.
- No blue nav active pill; the active state is a tint plus a 2px rule.
- No feature, route, form, action or data change.

---

## 11. Premium checklist (reviewer rejects on any failure)

1. `grep -rE "slate-|gray-|sky-|amber-|red-|green-|rounded-2xl" src/` returns zero matches; `rounded-xl` appears only on the operating panel and the drawer.
2. `layout.tsx` loads `Instrument_Sans` and `JetBrains_Mono` only; `Inter` and `--font-geist-*` do not appear anywhere.
3. `body` computed font-size is 14px with 20px line-height; table cells are 13px / 12.5px mono; nothing in the UI is below 11px.
4. Every AWB, flight, BK-/PA- number, CargoWise ref, Vapi id, phone, count, pcs, kg, USD, percent, duration and KPI value renders in `font-mono`; a column of kg values in Bookings aligns on the decimal at 1440px.
5. The first KPI cell is visibly the headline: 1.6fr wide with a 40px value against 26px secondaries, all in one bordered strip with no shadow and no hover effect.
6. Every status enum in the inventory (section 3.4) renders as a dot chip with a sentence-case label; only FLAGGED, FAILED and HIGH render filled; no badge is `rounded-full` or uppercase.
7. Cerulean appears only on: primary buttons, the focus ring, the IN_PROGRESS node and meter cell, the globe ring on light surfaces, and the `ok-dot`-free info dots. Nav active state, links, titles and KPI values are ink.
8. The sidebar is graphite (`#0f141a`) with the inverse typographic lockup, the dashed MIA to SJU strip, three groups (Logistics, Operations, Voice agent) with sentence-case labels, a 2px white active rule, a visible "Sign out" text button at lg, and "Powered by Onda" with the OndaMark. No PNG is requested by the sidebar.
9. The operating panel is a single `rounded-xl border border-line bg-surface shadow-panel` inset 8px from the canvas, with an 11px-tall top bar showing a breadcrumb and the static "CargoWise e-adapter" label; no "Live data" text exists.
10. All cards are `rounded-lg border border-line bg-surface` with zero box-shadow at rest; table wrappers use `overflow-x-auto`, and `overflow-x-hidden` is gone from `<main>`.
11. The same `Segments` component appears on Overview, the tracking table and the detail sync card, with ink fill in progress, cerulean on the current cell and green only at 6/6; no pill bar or percentage text remains.
12. The identifier cell is the first column of every table, in mono 500 ink with a hairline underline on linked rows; hovering a linked row shows the 2px inset ink rule; no "View →" links exist.
13. Every empty, not-found and error state uses `EmptyState` (icon box, title, one sentence, action) or `InlineNotice`; no bare red or green text exists.
14. The IN_PROGRESS milestone node pulses exactly three cycles and rests; the timeline rail is 1px with no `ring-4` knockouts; step numbers 01-06 appear at lg.
15. The call drawer: Escape closes, body scroll is locked while open, focus returns to the originating row on close, rows are reachable by Tab and open on Enter/Space, and the audio control is cerulean via `accent-color`. The login page renders cleanly with no network: lockup, dashed route diagram, statement and a card-less form on canvas.
