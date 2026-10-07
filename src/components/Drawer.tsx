'use client';

import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { CloseIcon } from '@/components/icons';

/*
  Drawer shell: scrim + right-anchored floating panel + header.
  Escape closes, body scroll locks while open, the close button autofocuses,
  Tab wraps inside the panel, and focus returns to the opener on close.
*/

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), audio[controls], [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 520,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: number;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 animate-fade-in bg-overlay/30" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapTab}
        className={`absolute inset-y-2 right-2 flex w-full animate-slide-in-right flex-col rounded-xl border border-line bg-surface shadow-drawer ${className ?? ''}`}
        style={{ maxWidth: width }}
      >
        <DrawerHeader title={title} subtitle={subtitle} titleId={titleId}>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition-colors duration-100 hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon />
          </button>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-stable">{children}</div>
      </div>
    </div>
  );
}

export function DrawerHeader({
  title,
  subtitle,
  titleId,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  titleId?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line px-5">
      <div className="min-w-0">
        <h2 id={titleId} className="truncate text-sm font-semibold text-ink">
          {title}
        </h2>
        {subtitle && <div className="truncate text-xs text-ink-3">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export function DrawerSection({
  label,
  children,
  className,
  grow = false,
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
  grow?: boolean;
}) {
  return (
    <section
      className={`border-b border-line-subtle px-5 py-4 last:border-0 ${grow ? 'flex min-h-0 flex-1 flex-col' : ''} ${className ?? ''}`}
    >
      {label && <div className="mb-2 text-xs font-medium text-ink-3">{label}</div>}
      {children}
    </section>
  );
}
