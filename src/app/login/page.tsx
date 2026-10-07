'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoginView } from '@/components/views/LoginView';

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
    <LoginView
      email={email}
      password={password}
      error={error}
      loading={loading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={onSubmit}
    />
  );
}
