import type { Config } from 'tailwindcss';

const t = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // Type scale is an override: every size carries its line-height and tracking.
    fontSize: {
      '2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['13px', { lineHeight: '20px' }],
      base: ['14px', { lineHeight: '20px' }],
      md: ['15px', { lineHeight: '22px', letterSpacing: '-0.005em' }],
      lg: ['17px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
      xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
      '2xl': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
      '3xl': ['26px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
      '4xl': ['32px', { lineHeight: '36px', letterSpacing: '-0.025em' }],
      '5xl': ['40px', { lineHeight: '44px', letterSpacing: '-0.03em' }],
    },
    // Radii are an override: 4 / 6 / 8 / 10. rounded-2xl no longer exists.
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '6px',
      md: '6px',
      lg: '8px',
      xl: '10px',
      full: '9999px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
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
      transitionTimingFunction: {
        out: 'cubic-bezier(.2,.8,.2,1)',
      },
      transitionDuration: {
        75: '75ms',
        100: '100ms',
        160: '160ms',
        200: '200ms',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 4px rgb(var(--ring) / 0.15)' },
          '50%': { boxShadow: '0 0 0 6px rgb(var(--ring) / 0.35)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms cubic-bezier(.2,.8,.2,1) both',
        'slide-in-right': 'slide-in-right 200ms cubic-bezier(.2,.8,.2,1) both',
        // Finite: settles after 3 cycles at the 15% ring.
        'pulse-ring': 'pulse-ring 2.4s ease-in-out 3 both',
        spin: 'spin 700ms linear infinite',
      },
      colors: {
        canvas: t('canvas'),
        surface: {
          DEFAULT: t('surface'),
          sunken: t('surface-sunken'),
          hover: t('surface-hover'),
          active: t('surface-active'),
        },
        overlay: t('overlay'),
        line: {
          DEFAULT: t('line'),
          subtle: t('line-subtle'),
          strong: t('line-strong'),
        },
        ink: {
          DEFAULT: t('ink'),
          2: t('ink-2'),
          3: t('ink-3'),
          4: t('ink-4'),
          inverse: t('ink-inverse'),
        },
        ring: t('ring'),
        sidebar: {
          // DEFAULT keeps the legacy `bg-sidebar` class rendering until every page is restyled.
          DEFAULT: t('sidebar-bg'),
          bg: t('sidebar-bg'),
          fg: t('sidebar-fg'),
          line: t('sidebar-line'),
          active: t('sidebar-active'),
          hover: t('sidebar-hover'),
        },
        ok: { dot: t('ok-dot'), fg: t('ok-fg'), bg: t('ok-bg') },
        warn: { dot: t('warn-dot'), fg: t('warn-fg'), bg: t('warn-bg') },
        danger: { dot: t('danger-dot'), fg: t('danger-fg'), bg: t('danger-bg') },
        info: { dot: t('info-dot'), fg: t('info-fg'), bg: t('info-bg') },
        neutral: { dot: t('neutral-dot'), fg: t('neutral-fg'), bg: t('neutral-bg') },
        // Transitional (spec section 3.1 removes these): legacy class names aliased to the
        // new tokens (no dead CSS variables) so views mid-refactor keep rendering. Delete once
        // `grep -rE "bg-background|bg-card|text-muted-foreground|border-border|bg-muted" src/` is empty.
        background: t('canvas'),
        foreground: t('ink'),
        card: t('surface'),
        muted: t('surface-sunken'),
        'muted-foreground': t('ink-3'),
        border: t('line'),
        'sidebar-foreground': t('sidebar-fg'),
        // Prime Global Logistics cerulean (kept verbatim).
        brand: {
          50: '#edf7fc',
          100: '#d3ecf8',
          200: '#a9d9f0',
          300: '#72c1e6',
          400: '#38a6d8',
          500: '#1b8fce',
          600: '#1678af',
          700: '#17638f',
          800: '#1a5474',
          900: '#133f57',
        },
        // Brand green (kept verbatim).
        accent: {
          50: '#f1f9ec',
          100: '#ddf0d0',
          200: '#bfe3a9',
          300: '#97d178',
          400: '#74c257',
          500: '#5cb948',
          600: '#4c9e3a',
          700: '#3c7d30',
          800: '#336429',
          900: '#2b5224',
        },
      },
    },
  },
  plugins: [],
};

export default config;
