'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, ChevronDown } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  email?: string | null;
  paymentTerms?: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  productType: string;
  sellingPrice: number;
  defaultTaxRate: number;
  description?: string;
}

interface TaxLine {
  taxType: string;
  rate: number;
  jurisdictionId?: string;
  taxRuleId?: string;
  isCompound?: boolean;
  compoundSequence?: number;
  isWithholding?: boolean;
}

interface InvoiceItem {
  productId?: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  taxLines?: TaxLine[];
  amount: number;
}

export default function NewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const customerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerId: customerId || '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    reference: '',
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxLines: [], amount: 0 },
  ]);
  const [expandedTaxRows, setExpandedTaxRows] = useState<Set<number>>(new Set());
  const [undoStack, setUndoStack] = useState<InvoiceItem[][]>([]);
  const [redoStack, setRedoStack] = useState<InvoiceItem[][]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const { currency } = useOrganization();

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, [orgSlug]);

  useEffect(() => {
    // Auto-calculate due date based on payment terms
    if (formData.customerId && formData.invoiceDate) {
      const customer = customers.find((c) => c.id === formData.customerId);
      if (customer) {
        const invoiceDate = new Date(formData.invoiceDate);
        const daysToAdd = Number.isFinite(customer.paymentTerms)
          ? Number(customer.paymentTerms)
          : 30;

        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        setFormData((prev) => ({
          ...prev,
          dueDate: dueDate.toISOString().split('T')[0],
        }));
      }
    }
  }, [formData.customerId, formData.invoiceDate, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orgs/${orgSlug}/customers?isActive=true`);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/${orgSlug}/inventory/products`);
      const data = await response.json();

      if (data.success) {
        const activeProducts = data.data.filter((p: any) => p.isActive);
        setProducts(activeProducts);
        
        // Log breakdown by type
        const byType = activeProducts.reduce((acc: any, p: any) => {
          acc[p.productType] = (acc[p.productType] || 0) + 1;
          return acc;
        }, {});
        console.log(`Loaded ${activeProducts.length} active products:`, byType);
      } else {
        console.error('Failed to fetch products:', data.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addItem = () => {
    setUndoStack((prev) => [...prev, items]);
    setRedoStack([]);
    const newItems = [...items, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxLines: [], amount: 0 }];
    setItems(newItems);
    
    // Auto-focus the product field of the new row after a brief delay
    setTimeout(() => {
      const productInputs = document.querySelectorAll('[data-item-product]');
      const lastInput = productInputs[productInputs.length - 1] as HTMLInputElement;
      if (lastInput) {
        lastInput.focus();
      }
    }, 100);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setUndoStack((prev) => [...prev, items]);
      setRedoStack([]);
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].amount = calculateLineAmount(newItems[index]);
    setItems(newItems);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        productName: product.name,
        description: product.description || '',
        unitPrice: product.sellingPrice,
        taxLines: product.defaultTaxRate > 0 ? [{
          taxType: 'STANDARD',
          rate: product.defaultTaxRate,
          compoundSequence: 1,
          isCompound: false,
          isWithholding: false,
        }] : [],
      };
      newItems[index].amount = calculateLineAmount(newItems[index]);
      setItems(newItems);
    }
  };

  const getPrimaryTaxRate = (item: InvoiceItem): number => {
    if (!item.taxLines || item.taxLines.length === 0) return 0;
    const primaryTax = item.taxLines.find(t => !t.isWithholding);
    return primaryTax ? primaryTax.rate : 0;
  };

  const updateTaxRate = (index: number, rate: number) => {
    const newItems = [...items];
    if (rate === 0) {
      newItems[index].taxLines = [];
    } else {
      newItems[index].taxLines = [{
        taxType: 'STANDARD',
        rate: rate,
        compoundSequence: 1,
        isCompound: false,
        isWithholding: false,
      }];
    }
    newItems[index].amount = calculateLineAmount(newItems[index]);
    setItems(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
    // Tab key on the last field of the last row adds a new line
    if (e.key === 'Tab' && !e.shiftKey && index === items.length - 1 && field === 'tax') {
      e.preventDefault();
      addItem();
    }
    
    // Enter key adds a new line
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const addTaxLine = (itemIndex: number) => {
    const newItems = [...items];
    if (!newItems[itemIndex].taxLines) {
      newItems[itemIndex].taxLines = [];
    }
    newItems[itemIndex].taxLines!.push({
      taxType: 'STANDARD',
      rate: 0,
      compoundSequence: (newItems[itemIndex].taxLines?.length || 0) + 1,
    });
    newItems[itemIndex].amount = calculateLineAmount(newItems[itemIndex]);
    setItems(newItems);
  };

  const updateTaxLine = (itemIndex: number, taxIndex: number, field: keyof TaxLine, value: any) => {
    const newItems = [...items];
    if (newItems[itemIndex].taxLines) {
      newItems[itemIndex].taxLines![taxIndex] = {
        ...newItems[itemIndex].taxLines![taxIndex],
        [field]: value,
      };
      newItems[itemIndex].amount = calculateLineAmount(newItems[itemIndex]);
      setItems(newItems);
    }
  };

  const removeTaxLine = (itemIndex: number, taxIndex: number) => {
    const newItems = [...items];
    if (newItems[itemIndex].taxLines) {
      newItems[itemIndex].taxLines = newItems[itemIndex].taxLines!.filter((_, i) => i !== taxIndex);
      newItems[itemIndex].amount = calculateLineAmount(newItems[itemIndex]);
      setItems(newItems);
    }
  };

  const calculateLineAmount = (item: InvoiceItem): number => {
    const quantity = parseFloat(String(item.quantity)) || 0;
    const unitPrice = parseFloat(String(item.unitPrice)) || 0;
    const discount = parseFloat(String(item.discount)) || 0;
    const subtotal = quantity * unitPrice - discount;

    if (!item.taxLines || item.taxLines.length === 0) {
      return subtotal;
    }

    let taxAccum = 0;
    const sortedTaxLines = [...item.taxLines].sort((a, b) => (a.compoundSequence || 1) - (b.compoundSequence || 1));
    sortedTaxLines.forEach((line) => {
      const base = line.isCompound ? subtotal + taxAccum : subtotal;
      const rate = parseFloat(String(line.rate)) || 0;
      const taxAmount = base * (rate / 100);
      if (!line.isWithholding) {
        taxAccum += taxAmount;
      }
    });

    return subtotal + taxAccum;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = parseFloat(String(item.quantity)) || 0;
      const unitPrice = parseFloat(String(item.unitPrice)) || 0;
      const discount = parseFloat(String(item.discount)) || 0;
      return sum + quantity * unitPrice - discount;
    }, 0);

    let tax = 0;
    let withholding = 0;

    for (const item of items) {
      if (!item.taxLines || item.taxLines.length === 0) {
        continue;
      }

      const quantity = parseFloat(String(item.quantity)) || 0;
      const unitPrice = parseFloat(String(item.unitPrice)) || 0;
      const discount = parseFloat(String(item.discount)) || 0;
      const itemSubtotal = quantity * unitPrice - discount;

      const sortedTaxLines = [...item.taxLines].sort((a, b) => (a.compoundSequence || 1) - (b.compoundSequence || 1));
      let taxAccum = 0;

      for (const line of sortedTaxLines) {
        const base = line.isCompound ? itemSubtotal + taxAccum : itemSubtotal;
        const rate = parseFloat(String(line.rate)) || 0;
        const taxAmount = base * (rate / 100);

        if (line.isWithholding) {
          withholding += taxAmount;
        } else {
          tax += taxAmount;
          taxAccum += taxAmount;
        }
      }
    }

    const total = subtotal + tax;
    const amountDue = total - withholding;

    return { subtotal, tax, withholding, total, amountDue };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.customerId) {
        throw new Error('Please select a customer');
      }

      if (items.length === 0 || items.some((item) => !item.productName && !item.description)) {
        throw new Error('Please add at least one item');
      }

      const response = await fetch(`/api/orgs/${orgSlug}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            productId: item.productId,
            description: item.description || item.productName,
            quantity: parseFloat(String(item.quantity)),
            unitPrice: parseFloat(String(item.unitPrice)),
            discount: parseFloat(String(item.discount || 0)),
            taxLines: (item.taxLines || []).map((line) => ({
              taxType: line.taxType,
              rate: parseFloat(String(line.rate)),
              jurisdictionId: line.jurisdictionId,
              taxRuleId: line.taxRuleId,
              isCompound: !!line.isCompound,
              compoundSequence: line.compoundSequence || 1,
              isWithholding: !!line.isWithholding,
            })),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      router.push(`/${orgSlug}/accounts-receivable/invoices/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      setRedoStack((prev) => [...prev, items]);
      const prevItems = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      setItems(prevItems);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      setUndoStack((prev) => [...prev, items]);
      const nextItems = redoStack[redoStack.length - 1];
      setRedoStack((prev) => prev.slice(0, -1));
      setItems(nextItems);
    }
  };

  const validateField = (field: string, value: string) => {
    let error = '';
    if (field === 'customerId' && !value) error = 'Customer is required.';
    if (field === 'invoiceDate' && !value) error = 'Invoice date is required.';
    if (field === 'dueDate' && !value) error = 'Due date is required.';
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const totals = calculateTotals();
  const selectedCustomer = customers.find((c) => c.id === formData.customerId);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="mt-8">
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/${orgSlug}/accounts-receivable/invoices`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
            <p className="text-gray-600 mt-1">Create a new invoice for a customer</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
                <Tooltip content="Select the customer to bill for this invoice.">
                  <span className="ml-1 text-blue-500 cursor-help">?</span>
                </Tooltip>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Customer"
                tabIndex={0}
                value={formData.customerId}
                onChange={e => {
                  setFormData({ ...formData, customerId: e.target.value });
                  validateField('customerId', e.target.value);
                }}
                onBlur={e => validateField('customerId', e.target.value)}
                required
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {formErrors.customerId && <div className="text-xs text-red-600 mt-1">{formErrors.customerId}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
                <Tooltip content="The date the invoice is issued. Affects due date.">
                  <span className="ml-1 text-blue-500 cursor-help">?</span>
                </Tooltip>
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Invoice Date"
                tabIndex={0}
                value={formData.invoiceDate}
                onChange={e => {
                  setFormData({ ...formData, invoiceDate: e.target.value });
                  validateField('invoiceDate', e.target.value);
                }}
                onBlur={e => validateField('invoiceDate', e.target.value)}
                required
              />
              {formErrors.invoiceDate && <div className="text-xs text-red-600 mt-1">{formErrors.invoiceDate}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
                <Tooltip content="When payment is due. Calculated from payment terms.">
                  <span className="ml-1 text-blue-500 cursor-help">?</span>
                </Tooltip>
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Due Date"
                tabIndex={0}
                value={formData.dueDate}
                onChange={e => {
                  setFormData({ ...formData, dueDate: e.target.value });
                  validateField('dueDate', e.target.value);
                }}
                onBlur={e => validateField('dueDate', e.target.value)}
                required
              />
              {formErrors.dueDate && <div className="text-xs text-red-600 mt-1">{formErrors.dueDate}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference
                <Tooltip content="Optional reference for your records (e.g. PO number).">
                  <span className="ml-1 text-blue-500 cursor-help">?</span>
                </Tooltip>
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Reference"
                tabIndex={0}
                value={formData.reference}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50">
                    #
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50 min-w-[120px]">
                    Product / Service
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50 min-w-[120px]">
                    Description
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 bg-gray-50 min-w-[100px]">
                    Qty
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 bg-gray-50 min-w-[120px]">
                    Rate
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 bg-gray-50 min-w-[120px]">
                    Discount
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 bg-gray-50 w-16">
                    Tax %
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 bg-gray-50 w-28">
                    Amount
                  </th>
                  <th className="px-3 py-3 bg-gray-50 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors group">
                      <td className="px-3 py-3 text-sm text-gray-600 align-top">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          data-item-product
                          className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 bg-white"
                          value={item.productId || ''}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              updateItem(index, 'productId', '');
                              updateItem(index, 'productName', '');
                            } else if (e.target.value) {
                              selectProduct(index, e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const descInput = document.querySelectorAll('[data-item-description]')[index] as HTMLInputElement;
                              if (descInput) descInput.focus();
                            }
                          }}
                        >
                          <option value="">Select product/service...</option>
                          
                          {/* Products Section */}
                          {products.filter(p => p.productType === 'INVENTORY').length > 0 && (
                            <optgroup label="─── Products ───">
                              {products.filter(p => p.productType === 'INVENTORY').map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.sku ? `(${p.sku})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          
                          {/* Services Section */}
                          {products.filter(p => p.productType === 'SERVICE').length > 0 && (
                            <optgroup label="─── Services ───">
                              {products.filter(p => p.productType === 'SERVICE').map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.sku ? `(${p.sku})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          
                          {/* Non-Inventory Section */}
                          {products.filter(p => p.productType === 'NON_INVENTORY').length > 0 && (
                            <optgroup label="─── Non-Inventory ───">
                              {products.filter(p => p.productType === 'NON_INVENTORY').map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.sku ? `(${p.sku})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          
                          <option value="custom">── Custom Item ──</option>
                        </select>
                        {(!item.productId && item.productName) && (
                          <input
                            type="text"
                            className="w-full px-2 py-1.5 mt-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 bg-blue-50"
                            placeholder="Custom item name"
                            value={item.productName}
                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          data-item-description
                          rows={2}
                          className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 resize-none"
                          placeholder="Add details (optional)"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              addItem();
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          className="w-full min-w-[90px] px-2 py-1 border border-gray-300 rounded text-xs text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-sm text-gray-500">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full min-w-[110px] pl-8 pr-2 py-1 border border-gray-300 rounded text-xs text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'unitPrice')}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-sm text-gray-500">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full min-w-[110px] pl-8 pr-2 py-1 border border-gray-300 rounded text-xs text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                            value={item.discount || 0}
                            onChange={(e) => updateItem(index, 'discount', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'discount')}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full min-w-[60px] px-2 pr-4 py-1 border border-gray-300 rounded text-xs text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                            value={getPrimaryTaxRate(item)}
                            onChange={(e) => updateTaxRate(index, parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'tax')}
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-2 text-sm text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right align-top">
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-2 py-2 rounded group-hover:bg-blue-100">
                          {formatCurrency(item.amount, currency)}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip content="Configure taxes">
                            <button
                              type="button"
                              onClick={() => setExpandedTaxRows(new Set(expandedTaxRows.has(index) ? [...expandedTaxRows].filter(i => i !== index) : [...expandedTaxRows, index]))}
                              className={`p-1.5 rounded transition-colors ${
                                (item.taxLines && item.taxLines.length > 0)
                                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 opacity-100'
                                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                              }`}
                              title="Tax lines"
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedTaxRows.has(index) ? 'transform rotate-180' : ''}`} />
                            </button>
                          </Tooltip>
                          {items.length > 1 && (
                            <Tooltip content="Delete line">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedTaxRows.has(index) && (
                      <tr className="bg-blue-50 border-b border-blue-100">
                        <td colSpan={9} className="px-3 py-4">
                          <div className="space-y-3 pl-8">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-700">Tax Configuration</h4>
                              <button
                                type="button"
                                onClick={() => addTaxLine(index)}
                                className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Tax Line
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(item.taxLines || []).map((taxLine, taxIndex) => (
                                <div key={taxIndex} className="flex items-center gap-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                                  <select
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    value={taxLine.taxType}
                                    onChange={(e) => updateTaxLine(index, taxIndex, 'taxType', e.target.value)}
                                  >
                                    <option value="STANDARD">Standard Tax</option>
                                    <option value="REDUCED">Reduced Rate</option>
                                    <option value="ZERO">Zero-Rated</option>
                                    <option value="EXEMPT">Exempt</option>
                                    <option value="WITHHOLDING">Withholding Tax</option>
                                  </select>

                                  <div className="relative w-24">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      max="100"
                                      placeholder="Rate"
                                      className="w-full px-3 py-2 pr-6 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
                                      value={taxLine.rate}
                                      onChange={(e) => updateTaxLine(index, taxIndex, 'rate', parseFloat(e.target.value) || 0)}
                                    />
                                    <span className="absolute right-3 top-2 text-sm text-gray-500">%</span>
                                  </div>

                                  <label className="flex items-center gap-1.5 text-sm cursor-pointer px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={taxLine.isCompound || false}
                                      onChange={(e) => updateTaxLine(index, taxIndex, 'isCompound', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Compound
                                  </label>

                                  <label className="flex items-center gap-1.5 text-sm cursor-pointer px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={taxLine.isWithholding || false}
                                      onChange={(e) => updateTaxLine(index, taxIndex, 'isWithholding', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    WHT
                                  </label>

                                  <Tooltip content="Remove tax line">
                                    <button
                                      type="button"
                                      onClick={() => removeTaxLine(index, taxIndex)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </Tooltip>
                                </div>
                              ))}

                              {(!item.taxLines || item.taxLines.length === 0) && (
                                <div className="text-sm text-gray-500 py-3 text-center bg-white border border-dashed border-gray-300 rounded">
                                  No tax lines configured. Click "Add Tax Line" to configure taxes.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                
                {/* Add new line row - QuickBooks style */}
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={9} className="px-3 py-2">
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full py-3 text-sm text-left text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors flex items-center justify-center font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Section - QuickBooks style */}
          <div className="mt-6 flex justify-end">
            <div className="w-80 space-y-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totals.subtotal, currency)}
                </span>
              </div>
              {totals.tax > 0 && (
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{formatCurrency(totals.tax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t-2 border-gray-300 pt-2 mt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(totals.total, currency)}</span>
              </div>
              {totals.withholding > 0 && (
                <>
                  <div className="flex justify-between text-sm py-1.5 text-red-600">
                    <span>Less: Withholding Tax</span>
                    <span className="font-medium">-{formatCurrency(totals.withholding, currency)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold bg-blue-600 text-white -mx-4 -mb-4 px-4 py-3 rounded-b-lg mt-2">
                    <span>Amount Due</span>
                    <span>{formatCurrency(totals.amountDue, currency)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes / Memo
            <Tooltip content="Add any additional notes or instructions for the customer.">
              <span className="ml-1 text-blue-500 cursor-help">?</span>
            </Tooltip>
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Add notes, payment instructions, or special terms..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/${orgSlug}/accounts-receivable/invoices`}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
