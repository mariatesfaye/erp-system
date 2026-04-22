'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';
import { AuthProvider } from '@/components/auth-context';
import type { Me } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/products', label: 'Products' },
  { href: '/stock', label: 'Stock' },
  { href: '/customers', label: 'Customers' },
  { href: '/invoices', label: 'Invoices' },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const data = await apiFetch<Me>('/auth/me');
        setMe(data);
      } catch {
        clearToken();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    void loadMe();
  }, [router]);

  const navItems = useMemo(() => {
    if (!me) return [];
    if (me.role === 'ADMIN') return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => item.href !== '/stock');
  }, [me]);

  function logout() {
    clearToken();
    router.replace('/login');
  }

  if (loading) {
    return <div className='p-6'>Loading...</div>;
  }

  if (!me) {
    return <div className='p-6'>Unauthorized</div>;
  }

  return (
    <AuthProvider me={me}>
      <div className='min-h-screen grid grid-cols-[220px_1fr]'>
        <aside className='border-r border-zinc-200 bg-white p-4'>
          <h2 className='text-lg font-semibold mb-4'>Mini ERP</h2>
          <nav className='space-y-1'>
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded px-3 py-2 text-sm ${active ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className='min-h-screen'>
          <header className='border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between'>
            <span className='text-sm text-zinc-600'>Role: {me.role}</span>
            <button onClick={logout} className='rounded border px-3 py-1 text-sm'>
              Logout
            </button>
          </header>
          <main className='p-6'>{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
