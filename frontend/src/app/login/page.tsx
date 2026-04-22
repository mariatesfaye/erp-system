'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getToken, setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getToken()) {
      router.replace('/products');
    }
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);
      router.replace('/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <form
        onSubmit={onSubmit}
        className='w-full max-w-md rounded bg-white p-6 shadow-sm border border-zinc-200 space-y-4'
      >
        <h1 className='text-xl font-semibold'>Mini ERP Login</h1>

        <div>
          <label className='block text-sm mb-1'>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded border border-zinc-300 px-3 py-2'
            type='email'
            required
          />
        </div>

        <div>
          <label className='block text-sm mb-1'>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full rounded border border-zinc-300 px-3 py-2'
            type='password'
            required
          />
        </div>

        {error && <p className='text-sm text-red-600'>{error}</p>}

        <button
          type='submit'
          disabled={loading}
          className='w-full rounded bg-zinc-900 text-white py-2 disabled:opacity-60'
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
