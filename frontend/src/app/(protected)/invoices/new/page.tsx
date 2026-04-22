'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { Customer, Product } from '@/lib/types';

type DraftLine = {
  productId: string;
  quantity: string;
};

export default function NewInvoicePage() {
  const { me } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ productId: '', quantity: '1' }]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [customersData, productsData] = await Promise.all([
          apiFetch<Customer[]>('/customers'),
          apiFetch<Product[]>('/products'),
        ]);
        setCustomers(customersData);
        setProducts(productsData);
        if (customersData.length > 0) setCustomerId(customersData[0].id);
        if (productsData.length > 0) {
          setLines([{ productId: productsData[0].id, quantity: '1' }]);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const hasDuplicateProducts = useMemo(() => {
    const ids = lines.map((line) => line.productId).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }, [lines]);

  function updateLine(index: number, partial: Partial<DraftLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...partial } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: products[0]?.id ?? '', quantity: '1' }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (hasDuplicateProducts) {
      setError('Duplicate product selections are not allowed.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          lines: lines.map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
          })),
        }),
      });
      sessionStorage.setItem('invoices_success', 'Invoice draft created successfully.');
      router.push('/invoices');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  }

  if (me.role !== 'ADMIN') {
    return <p>Forbidden: ADMIN only.</p>;
  }

  if (loading) return <p>Loading...</p>;
  if (customers.length === 0 || products.length === 0) return <p>No data found.</p>;

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>New Invoice</h1>
      {error && <p className='text-sm text-red-600'>{error}</p>}

      <form onSubmit={onSubmit} className='bg-white border rounded p-4 space-y-4'>
        <div>
          <label className='block text-sm mb-1'>Customer</label>
          <select className='w-full border rounded px-3 py-2' value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='font-medium'>Lines</h2>
            <button type='button' className='underline text-sm' onClick={addLine}>Add line</button>
          </div>

          {lines.map((line, index) => (
            <div key={index} className='grid grid-cols-[1fr_160px_auto] gap-3 items-end'>
              <div>
                <label className='block text-sm mb-1'>Product</label>
                <select className='w-full border rounded px-3 py-2' value={line.productId} onChange={(e) => updateLine(index, { productId: e.target.value })} required>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm mb-1'>Quantity</label>
                <input className='w-full border rounded px-3 py-2' type='number' min='1' value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} required />
              </div>
              <button type='button' className='underline text-sm' onClick={() => removeLine(index)} disabled={lines.length === 1}>Remove</button>
            </div>
          ))}
        </div>

        {hasDuplicateProducts && <p className='text-sm text-red-600'>Duplicate product selections are not allowed.</p>}

        <button disabled={submitting || hasDuplicateProducts} className='rounded bg-zinc-900 text-white px-4 py-2 disabled:opacity-60'>
          {submitting ? 'Loading...' : 'Create Draft'}
        </button>
      </form>
    </div>
  );
}
