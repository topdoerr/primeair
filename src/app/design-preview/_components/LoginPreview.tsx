'use client';

import { useState } from 'react';
import { LoginView } from '@/components/views/LoginView';

// Dev-only wrapper: holds the controlled-form state so the preview is
// typeable, but never submits (no Supabase, no navigation).
export function LoginPreview({
  initialEmail = '',
  initialPassword = '',
  error = null,
  loading = false,
}: {
  initialEmail?: string;
  initialPassword?: string;
  error?: string | null;
  loading?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);

  return (
    <LoginView
      email={email}
      password={password}
      error={error}
      loading={loading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={(e) => e.preventDefault()}
    />
  );
}
