'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/components/auth-context';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const { me } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Product[]>('/products');
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

    useEffect(() => {
    void loadProducts();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          sku,
          name,
          unitPrice: Number(unitPrice),
        }),
      });
      setSku('');
      setName('');
      setUnitPrice('');
      setSuccess('Product created successfully.');
      await loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-xl font-semibold'>Products</h1>

      {error && <p className='text-sm text-red-600'>{error}</p>}
      {success && <p className='text-sm text-green-700'>{success}</p>}

      {me.role === 'ADMIN' && (
        <form onSubmit={onCreate} className='bg-white border rounded p-4 space-y-3'>
          <h2 className='font-medium'>Create Product</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <input className='border rounded px-3 py-2' placeholder='SKU' value={sku} onChange={(e) => setSku(e.target.value)} required />
            <input className='border rounded px-3 py-2' placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} required />
            <input className='border rounded px-3 py-2' placeholder='Unit price' value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} type='number' step='0.01' required />
          </div>
          <button className='rounded bg-zinc-900 text-white px-4 py-2 disabled:opacity-60' disabled={submitting}>
            {submitting ? 'Loading...' : 'Create'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <div className='bg-white border rounded overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-zinc-50'>
              <tr>
                <th className='text-left px-3 py-2'>SKU</th>
                <th className='text-left px-3 py-2'>Name</th>
                <th className='text-left px-3 py-2'>Unit Price</th>
                <th className='text-left px-3 py-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className='border-t'>
                  <td className='px-3 py-2'>{product.sku}</td>
                  <td className='px-3 py-2'>{product.name}</td>
                  <td className='px-3 py-2'>{product.unitPrice}</td>
                  <td className='px-3 py-2'><Link href={`/products/${product.id}`} className='underline'>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
