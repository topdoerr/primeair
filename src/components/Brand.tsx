import Link from 'next/link';
import { OndaMark } from '@/components/icons';

/*
  Self-contained typographic wordmark: SVG globe (ring + one meridian) with the
  green arrow, "Prime Air" / "GLOBAL LOGISTICS". Pure SVG + text, no network.
  `inverse` is the graphite-sidebar / login-hero variant.
*/

export function BrandMark({
  size = 22,
  inverse = false,
  className = '',
}: {
  size?: number;
  inverse?: boolean;
  className?: string;
}) {
  const ring = inverse ? 'rgb(var(--sidebar-fg) / 0.9)' : '#1678af';
  const meridian = inverse ? 'rgb(var(--sidebar-fg) / 0.45)' : 'rgb(22 120 175 / 0.45)';
  const knockout = inverse ? 'rgb(var(--sidebar-bg))' : 'rgb(var(--surface))';
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden className={className}>
      <circle cx="11" cy="11" r="8.25" stroke={ring} strokeWidth="1.75" />
      <ellipse cx="11" cy="11" rx="3.25" ry="8.25" stroke={meridian} strokeWidth="1.25" />
      <path
        d="M11.5 15.5h7.5M15.5 12l3.5 3.5-3.5 3.5"
        stroke={knockout}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 15.5h7.5M15.5 12l3.5 3.5-3.5 3.5"
        stroke="#5cb948"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({
  size = 'sm',
  inverse = false,
  href = '/',
  className = '',
  textClassName = '',
}: {
  size?: 'sm' | 'lg';
  inverse?: boolean;
  /** null renders a static lockup (login hero). */
  href?: string | null;
  className?: string;
  /** Extra classes on the text block, e.g. `hidden lg:block` in the rail. */
  textClassName?: string;
}) {
  const lg = size === 'lg';
  const inner = (
    <>
      <BrandMark size={lg ? 32 : 22} inverse={inverse} className="shrink-0" />
      <span className={`min-w-0 leading-none ${textClassName}`}>
        <span
          className={`block font-semibold tracking-[-0.01em] ${
            lg ? 'text-lg leading-5' : 'text-[13.5px] leading-4'
          } ${inverse ? 'text-sidebar-fg' : 'text-ink'}`}
        >
          Prime Air
        </span>
        <span
          className={`mt-0.5 block font-medium uppercase leading-3 tracking-[0.14em] ${
            lg ? 'text-[10px]' : 'text-[9.5px]'
          } ${inverse ? 'text-sidebar-fg/55' : 'text-ink-3'}`}
        >
          Global Logistics
        </span>
      </span>
    </>
  );
  if (!href) return <span className={`flex items-center gap-2.5 ${className}`}>{inner}</span>;
  return (
    <Link
      href={href}
      aria-label="Prime Air, Overview"
      className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        inverse ? 'hover:bg-sidebar-hover/5' : 'hover:bg-surface-hover'
      } ${className}`}
    >
      {inner}
    </Link>
  );
}

export function PoweredByOnda({
  inverse = false,
  compact = false,
  className = '',
}: {
  inverse?: boolean;
  /** Rail mode: mark only. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-2xs ${
        inverse ? 'text-sidebar-fg/45' : 'text-ink-3'
      } ${className}`}
    >
      <span className={compact ? 'hidden lg:inline' : undefined}>Powered by</span>
      <OndaMark size={12} className={`h-3 w-3 ${inverse ? 'text-sidebar-fg/60' : 'text-ink-3'}`} />
      <span
        className={`font-semibold tracking-[-0.01em] ${inverse ? 'text-sidebar-fg/80' : 'text-ink-2'} ${
          compact ? 'hidden lg:inline' : ''
        }`}
      >
        Onda
      </span>
    </span>
  );
}

/** Dashed MIA to SJU route strip. Used exactly twice: sidebar and top bar (rail mode). */
export function RouteStrip({
  inverse = false,
  caption = 'Air cargo',
  className = '',
}: {
  inverse?: boolean;
  caption?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 font-mono text-2xs ${
        inverse ? 'text-sidebar-fg/70' : 'text-ink-2'
      } ${className}`}
      aria-label="Route Miami to San Juan"
    >
      <span>MIA</span>
      <span
        aria-hidden
        className={`h-px flex-1 border-t border-dashed ${inverse ? 'border-sidebar-line/25' : 'border-line-strong'}`}
      />
      <span>SJU</span>
      {caption && (
        <span className={`ml-1 font-sans text-2xs ${inverse ? 'text-sidebar-fg/45' : 'text-ink-3'}`}>{caption}</span>
      )}
    </div>
  );
}
