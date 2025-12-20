'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewProductPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;

  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    productType: 'INVENTORY',
    category: '',
    unitOfMeasure: 'unit',
    purchasePrice: '0',
    sellingPrice: '0',
    trackInventory: true,
    reorderLevel: '',
    reorderQuantity: '',
    taxable: true,
    defaultTaxRate: '0',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    // Force non-inventory/service to not track inventory
    if (name === 'productType') {
      const nextType = value;
      setForm((prev) => ({
        ...prev,
        productType: nextType,
        trackInventory: nextType === 'INVENTORY',
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/${orgSlug}/inventory/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          purchasePrice: Number(form.purchasePrice || 0),
          sellingPrice: Number(form.sellingPrice || 0),
          reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : undefined,
          reorderQuantity: form.reorderQuantity ? Number(form.reorderQuantity) : undefined,
          defaultTaxRate: Number(form.defaultTaxRate || 0),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create product');
      }

      router.push(`/${orgSlug}/inventory/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">New Product</h1>
      <p className="text-gray-600 mb-6">Create inventory, services, or non-inventory items.</p>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Type</label>
            <select
              name="productType"
              value={form.productType}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="INVENTORY">Inventory</option>
              <option value="SERVICE">Service</option>
              <option value="NON_INVENTORY">Non-Inventory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit of Measure</label>
            <input
              name="unitOfMeasure"
              value={form.unitOfMeasure}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
            <input
              name="purchasePrice"
              type="number"
              step="0.01"
              value={form.purchasePrice}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Selling Price</label>
            <input
              name="sellingPrice"
              type="number"
              step="0.01"
              value={form.sellingPrice}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Tax Rate (%)</label>
            <input
              name="defaultTaxRate"
              type="number"
              step="0.01"
              value={form.defaultTaxRate}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                name="trackInventory"
                checked={form.trackInventory}
                onChange={onChange}
                disabled={form.productType !== 'INVENTORY'}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
              />
              <span className="text-sm text-gray-700">Track inventory</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" name="taxable" checked={form.taxable} onChange={onChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Taxable</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
            <input
              name="reorderLevel"
              type="number"
              step="0.01"
              value={form.reorderLevel}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reorder Quantity</label>
            <input
              name="reorderQuantity"
              type="number"
              step="0.01"
              value={form.reorderQuantity}
              onChange={onChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Save Product'}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
            onClick={() => router.push(`/${orgSlug}/inventory/products`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
