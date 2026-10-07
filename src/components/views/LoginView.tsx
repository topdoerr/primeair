'use client';

import { useId, type CSSProperties } from 'react';
import { BrandLockup, Button, Field, InlineNotice, Input } from '@/components/ui';
import { ArrowRightIcon, OndaMark } from '@/components/icons';

export type LoginViewProps = {
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

// The hero is #0a0e14 (spec 4.4), slightly deeper than the graphite rail. The brand
// mark knocks its arrow out with `--sidebar-bg`, so the token is re-pointed here to
// keep the knockout invisible against the hero surface.
const HERO_TOKENS = { '--sidebar-bg': '10 14 20' } as CSSProperties;

export function LoginView({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginViewProps) {
  const emailId = useId();
  const passwordId = useId();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Hero: ink surface with the hairline grid. No network dependency. */}
      <section
        aria-label="Prime Air"
        style={HERO_TOKENS}
        className="login-hero relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
      >
        <BrandLockup size="lg" inverse href={null} />

        <div>
          {/* Route diagram: the second and last use of the dashed route motif. */}
          <div className="relative mt-16 flex items-center gap-6 font-mono" aria-label="Route Miami to San Juan">
            <div>
              <div className="text-4xl tracking-[-0.025em]">MIA</div>
              <div className="mt-1 font-sans text-xs text-white/50">Miami</div>
            </div>
            <div className="relative h-px flex-1 border-t border-dashed border-white/25" aria-hidden>
              <span className="absolute left-[60%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white" />
              <ArrowRightIcon className="absolute -right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent-500" />
            </div>
            <div>
              <div className="text-4xl tracking-[-0.025em]">SJU</div>
              <div className="mt-1 font-sans text-xs text-white/50">San Juan</div>
            </div>
          </div>

          <p className="mt-10 max-w-[36ch] text-xl font-semibold tracking-[-0.015em] text-balance">
            Air cargo operations, answered on the first ring.
          </p>
          <p className="mt-3 max-w-[44ch] text-base text-white/60 text-pretty">
            AWB status, pickups and discrepancies for the Miami to San Juan lane.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span>Powered by</span>
          <OndaMark size={12} className="h-3 w-3 text-white/70" />
          <span className="font-semibold tracking-[-0.01em] text-white/80">Onda</span>
        </div>
      </section>

      {/* Sign-in: a card-less form on the canvas. */}
      <div className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-[360px]">
          <BrandLockup size="sm" href={null} className="mb-8 lg:hidden" />

          <h1 className="text-xl font-semibold tracking-[-0.015em] text-ink">Sign in</h1>
          <p className="mt-1 text-base text-ink-3">Cargo operations dashboard</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field label="Email" htmlFor={emailId}>
              <Input
                id={emailId}
                size="xl"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="you@primeair.example"
              />
            </Field>

            <Field label="Password" htmlFor={passwordId}>
              <Input
                id={passwordId}
                size="xl"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
              />
            </Field>

            {error && (
              <InlineNotice tone="danger" className="w-full">
                {error}
              </InlineNotice>
            )}

            <Button type="submit" variant="primary" size="lg" className="h-10 w-full text-base" busy={loading}>
              {loading ? 'Signing in' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-xs text-ink-3">Access is provisioned by Prime Air operations.</p>
        </div>
      </div>
    </div>
  );
}
