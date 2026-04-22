'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { ProductWithBalance } from '@/lib/types';

export default function ProductDetailPage() {
  const { me } = useAuth();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [product, setProduct] = useState<ProductWithBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ProductWithBalance>(`/products/${productId}`);
      setProduct(data);
      setSku(data.sku);
      setName(data.name);
      setUnitPrice(String(data.unitPrice));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    void loadProduct();
  }, [productId, loadProduct]);

  async function onUpdate(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sku, name, unitPrice: Number(unitPrice) }),
      });
      setSuccess('Product updated successfully.');
      await loadProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>No data found.</p>;

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Product Detail</h1>
      {error && <p className='text-sm text-red-600'>{error}</p>}
      {success && <p className='text-sm text-green-700'>{success}</p>}

      <div className='bg-white border rounded p-4'>
        <p><strong>Balance:</strong> {product.balance}</p>
      </div>

      {me.role === 'ADMIN' ? (
        <form onSubmit={onUpdate} className='bg-white border rounded p-4 space-y-3'>
          <h2 className='font-medium'>Update Product</h2>
          <input className='w-full border rounded px-3 py-2' value={sku} onChange={(e) => setSku(e.target.value)} required />
          <input className='w-full border rounded px-3 py-2' value={name} onChange={(e) => setName(e.target.value)} required />
          <input className='w-full border rounded px-3 py-2' type='number' step='0.01' value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
          <button disabled={submitting} className='rounded bg-zinc-900 text-white px-4 py-2 disabled:opacity-60'>
            {submitting ? 'Loading...' : 'Update'}
          </button>
        </form>
      ) : (
        <div className='bg-white border rounded p-4 text-sm text-zinc-600'>Read-only for STAFF.</div>
      )}
    </div>
  );
}
