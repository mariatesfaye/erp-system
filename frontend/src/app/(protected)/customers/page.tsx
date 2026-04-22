'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { Customer } from '@/lib/types';

export default function CustomersPage() {
  const { me } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Customer[]>('/customers');
      setCustomers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

    useEffect(() => {
    void loadCustomers();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch('/customers', { method: 'POST', body: JSON.stringify({ name }) });
      setName('');
      setSuccess('Customer created successfully.');
      await loadCustomers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdate(customerId: string) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/customers/${customerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editingName }),
      });
      setEditingId(null);
      setEditingName('');
      setSuccess('Customer updated successfully.');
      await loadCustomers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-xl font-semibold'>Customers</h1>
      {error && <p className='text-sm text-red-600'>{error}</p>}
      {success && <p className='text-sm text-green-700'>{success}</p>}

      {me.role === 'ADMIN' && (
        <form onSubmit={onCreate} className='bg-white border rounded p-4 space-y-3 max-w-md'>
          <h2 className='font-medium'>Create Customer</h2>
          <input className='w-full border rounded px-3 py-2' value={name} onChange={(e) => setName(e.target.value)} placeholder='Name' required />
          <button className='rounded bg-zinc-900 text-white px-4 py-2 disabled:opacity-60' disabled={submitting}>
            {submitting ? 'Loading...' : 'Create'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : customers.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <div className='bg-white border rounded overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-zinc-50'>
              <tr>
                <th className='text-left px-3 py-2'>Name</th>
                <th className='text-left px-3 py-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className='border-t'>
                  <td className='px-3 py-2'>
                    {editingId === customer.id ? (
                      <input className='border rounded px-2 py-1' value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    ) : (
                      customer.name
                    )}
                  </td>
                  <td className='px-3 py-2'>
                    {me.role === 'ADMIN' && (editingId === customer.id ? (
                      <button className='underline' onClick={() => void onUpdate(customer.id)} disabled={submitting}>Save</button>
                    ) : (
                      <button className='underline' onClick={() => { setEditingId(customer.id); setEditingName(customer.name); }}>Edit</button>
                    ))}
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
