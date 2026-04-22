'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function StockPage() {
  const { me } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Product[]>('/products');
      setProducts(data);
      if (data.length > 0) {
        setProductId((prev) => prev || data[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch('/stock-movements', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: Number(quantity) }),
      });
      setSuccess('Stock movement created successfully.');
      setQuantity('1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create stock movement');
    } finally {
      setSubmitting(false);
    }
  }

  if (me.role !== 'ADMIN') {
    return <p>Forbidden: ADMIN only.</p>;
  }

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Stock (IN)</h1>
      {error && <p className='text-sm text-red-600'>{error}</p>}
      {success && <p className='text-sm text-green-700'>{success}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <form onSubmit={onSubmit} className='bg-white border rounded p-4 space-y-3 max-w-md'>
          <label className='block text-sm'>Product</label>
          <select className='w-full border rounded px-3 py-2' value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
            ))}
          </select>

          <label className='block text-sm'>Quantity</label>
          <input className='w-full border rounded px-3 py-2' type='number' min='1' value={quantity} onChange={(e) => setQuantity(e.target.value)} required />

          <button className='rounded bg-zinc-900 text-white px-4 py-2 disabled:opacity-60' disabled={submitting}>
            {submitting ? 'Loading...' : 'Create IN Movement'}
          </button>
        </form>
      )}
    </div>
  );
}
