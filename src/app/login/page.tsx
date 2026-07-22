'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirectTo') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      setError(
        'Authentication is not configured for this deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (for this environment) and redeploy.',
      );
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        // Fall back to a helpful message when the error has no readable text
        // (e.g. the auth endpoint is unreachable and returns a non-standard body).
        setError(
          error.message?.trim() && error.message.trim() !== '{}'
            ? error.message
            : 'Could not sign in. Verify the Supabase URL and anon key are correct and set for this environment, then redeploy.',
        );
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(
        (err as Error)?.message ||
          'Could not reach the authentication service. Check the Supabase configuration for this deployment.',
      );
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Hero image panel (large screens only). */}
      <div className="relative hidden w-1/2 bg-brand-900 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://golvuayo9mmzga7x.public.blob.vercel-storage.com/ChatGPT%20Image%20Jul%2022%2C%202026%2C%2004_26_30%20PM.png"
          alt="Prime Global Logistics"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-2xl font-semibold leading-snug text-white text-balance">
            Air cargo operations, answered on the first ring.
          </p>
          <p className="mt-2 text-sm text-white/70">
            AWB status, pickups, and discrepancies — MIA to SJU.
          </p>
        </div>
      </div>

      {/* Sign-in panel. */}
      <div className="flex w-full items-center justify-center bg-background px-4 lg:w-1/2">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.08)]">
          <div className="mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://primeaircorp.com/wp-content/uploads/2025/03/Prime-Global-Logistics-Logo-e1753980018767.png"
              alt="Prime Air Corp"
              className="mb-4 h-11 w-auto"
            />
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to the cargo operations dashboard
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="ops@primeair.example"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
