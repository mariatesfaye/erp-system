'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { Customer, Invoice, Product } from '@/lib/types';

type DraftLine = {
  productId: string;
  quantity: string;
};

export default function InvoiceDetailPage() {
  const { me } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDraft = invoice?.status === 'DRAFT';

  const hasDuplicateProducts = useMemo(() => {
    const ids = lines.map((line) => line.productId).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }, [lines]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoiceData, customersData, productsData] = await Promise.all([
        apiFetch<Invoice>(`/invoices/${id}`),
        apiFetch<Customer[]>('/customers'),
        apiFetch<Product[]>('/products'),
      ]);
      setInvoice(invoiceData);
      setCustomers(customersData);
      setProducts(productsData);
      setCustomerId(invoiceData.customerId);
      setLines(invoiceData.lines.map((line) => ({ productId: line.productId, quantity: String(line.quantity) })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void loadPage();
  }, [id, loadPage]);

  function updateLine(index: number, partial: Partial<DraftLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...partial } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: products[0]?.id ?? '', quantity: '1' }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!invoice || !isDraft) return;
    if (hasDuplicateProducts) {
      setError('Duplicate product selections are not allowed.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/invoices/${invoice.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customerId,
          lines: lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity) })),
        }),
      });
      setSuccess('Invoice updated successfully.');
      await loadPage();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  }

  async function onIssue() {
    if (!invoice || !isDraft) return;

    setIssuing(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/invoices/${invoice.id}/issue`, { method: 'POST' });
      setSuccess('Invoice issued successfully.');
      await loadPage();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to issue invoice');
    } finally {
      setIssuing(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!invoice) return <p>No data found.</p>;

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Invoice {invoice.invoiceNumber}</h1>
      <p className='text-sm text-zinc-600'>Status: {invoice.status}</p>

      {error && <p className='text-sm text-red-600'>{error}</p>}
      {success && <p className='text-sm text-green-700'>{success}</p>}

      {me.role !== 'ADMIN' && <div className='bg-white border rounded p-4 text-sm text-zinc-600'>Read-only for STAFF.</div>}

      {me.role === 'ADMIN' && isDraft ? (
        <form onSubmit={onSave} className='bg-white border rounded p-4 space-y-4'>
          <div>
            <label className='block text-sm mb-1'>Customer</label>
            <select className='w-full border rounded px-3 py-2' value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h2 className='font-medium'>Lines</h2>
              <button type='button' onClick={addLine} className='underline text-sm'>Add line</button>
            </div>
            {lines.map((line, index) => (
              <div key={index} className='grid grid-cols-[1fr_160px_auto] gap-3 items-end'>
                <div>
                  <label className='block text-sm mb-1'>Product</label>
                  <select className='w-full border rounded px-3 py-2' value={line.productId} onChange={(e) => updateLine(index, { productId: e.target.value })}>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className='block text-sm mb-1'>Quantity</label>
                  <input className='w-full border rounded px-3 py-2' type='number' min='1' value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} />
                </div>
                <button type='button' className='underline text-sm' onClick={() => removeLine(index)} disabled={lines.length === 1}>Remove</button>
              </div>
            ))}
          </div>

          {hasDuplicateProducts && <p className='text-sm text-red-600'>Duplicate product selections are not allowed.</p>}

          <div className='flex gap-3'>
            <button disabled={saving || hasDuplicateProducts} className='rounded bg-zinc-900 text-white px-4 py-2 disabled:opacity-60'>
              {saving ? 'Loading...' : 'Save Draft'}
            </button>
            <button type='button' disabled={issuing} onClick={() => void onIssue()} className='rounded border px-4 py-2 disabled:opacity-60'>
              {issuing ? 'Loading...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      ) : (
        <div className='bg-white border rounded p-4 space-y-2'>
          <p><strong>Customer ID:</strong> {invoice.customerId}</p>
          <p><strong>Issued At:</strong> {invoice.issuedAt ?? '-'}</p>
          <h2 className='font-medium pt-2'>Lines</h2>
          {invoice.lines.length === 0 ? <p>No data found.</p> : (
            <ul className='list-disc pl-5 space-y-1'>
              {invoice.lines.map((line) => <li key={line.id}>Product: {line.productId} | Qty: {line.quantity} | Unit Price: {line.unitPrice}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
