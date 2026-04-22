'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { Invoice } from '@/lib/types';

export default function InvoicesPage() {
  const { me } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadInvoices() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Invoice[]>('/invoices');
      setInvoices(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

    useEffect(() => {
    const flash = sessionStorage.getItem('invoices_success');
    if (flash) {
            setSuccess(flash);
      sessionStorage.removeItem('invoices_success');
    }
    void loadInvoices();
  }, []);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Invoices</h1>
        {me.role === 'ADMIN' && (
          <Link href='/invoices/new' className='rounded bg-zinc-900 text-white px-4 py-2 text-sm'>
            New Invoice
          </Link>
        )}
      </div>

      {error && <p className='text-sm text-red-600'>{error}</p>}
      {success && <p className='text-sm text-green-700'>{success}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : invoices.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <div className='bg-white border rounded overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-zinc-50'>
              <tr>
                <th className='text-left px-3 py-2'>Invoice #</th>
                <th className='text-left px-3 py-2'>Status</th>
                <th className='text-left px-3 py-2'>Lines</th>
                <th className='text-left px-3 py-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className='border-t'>
                  <td className='px-3 py-2'>{invoice.invoiceNumber}</td>
                  <td className='px-3 py-2'>{invoice.status}</td>
                  <td className='px-3 py-2'>{invoice.lines.length}</td>
                  <td className='px-3 py-2'>
                    <Link className='underline' href={`/invoices/${invoice.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
