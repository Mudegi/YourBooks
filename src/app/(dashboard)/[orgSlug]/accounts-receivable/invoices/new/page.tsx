'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, ChevronDown } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface Customer {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  paymentTerms: string;
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
    { description: '', quantity: 1, unitPrice: 0, discount: 0, taxLines: [], amount: 0 },
  ]);
  const [expandedTaxRows, setExpandedTaxRows] = useState<Set<number>>(new Set());
  const [undoStack, setUndoStack] = useState<InvoiceItem[][]>([]);
  const [redoStack, setRedoStack] = useState<InvoiceItem[][]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCustomers();
  }, [orgSlug]);

  useEffect(() => {
    // Auto-calculate due date based on payment terms
    if (formData.customerId && formData.invoiceDate) {
      const customer = customers.find((c) => c.id === formData.customerId);
      if (customer) {
        const invoiceDate = new Date(formData.invoiceDate);
        let daysToAdd = 30; // Default NET_30

        switch (customer.paymentTerms) {
          case 'DUE_ON_RECEIPT':
            daysToAdd = 0;
            break;
          case 'NET_15':
            daysToAdd = 15;
            break;
          case 'NET_30':
            daysToAdd = 30;
            break;
          case 'NET_60':
            daysToAdd = 60;
            break;
          case 'NET_90':
            daysToAdd = 90;
            break;
        }

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

  const addItem = () => {
    setUndoStack((prev) => [...prev, items]);
    setRedoStack([]);
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0, taxLines: [], amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setUndoStack((prev) => [...prev, items]);
      setRedoStack([]);
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setUndoStack((prev) => [...prev, items]);
    setRedoStack([]);
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].amount = calculateLineAmount(newItems[index]);
    setItems(newItems);
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

      if (items.length === 0 || items.some((item) => !item.description)) {
        throw new Error('Please add at least one item with a description');
      }

      const response = await fetch(`/api/orgs/${orgSlug}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            description: item.description,
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
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Discount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Amount
                  </th>
                  <th className="px-4 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          aria-label="Item description"
                          tabIndex={0}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          aria-label="Quantity"
                          tabIndex={0}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          aria-label="Unit Price"
                          tabIndex={0}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={item.discount || 0}
                          onChange={(e) => updateItem(index, 'discount', e.target.value)}
                          aria-label="Discount"
                          tabIndex={0}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm font-medium text-gray-900">
                          ${item.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setExpandedTaxRows(new Set(expandedTaxRows.has(index) ? [...expandedTaxRows].filter(i => i !== index) : [...expandedTaxRows, index]))}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Expand tax lines"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedTaxRows.has(index) ? 'transform rotate-180' : ''}`} />
                          </button>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedTaxRows.has(index) && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-700">Tax Lines</h4>
                              <button
                                type="button"
                                onClick={() => addTaxLine(index)}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Tax
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(item.taxLines || []).map((taxLine, taxIndex) => (
                                <div key={taxIndex} className="flex items-center gap-2 bg-white p-3 rounded border border-gray-200">
                                  <select
                                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    value={taxLine.taxType}
                                    onChange={(e) => updateTaxLine(index, taxIndex, 'taxType', e.target.value)}
                                  >
                                    <option value="STANDARD">Standard Tax</option>
                                    <option value="REDUCED">Reduced Rate</option>
                                    <option value="ZERO">Zero-Rated</option>
                                    <option value="EXEMPT">Exempt</option>
                                    <option value="WITHHOLDING">Withholding Tax</option>
                                  </select>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    max="100"
                                    placeholder="Rate %"
                                    className="w-20 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    value={taxLine.rate}
                                    onChange={(e) => updateTaxLine(index, taxIndex, 'rate', parseFloat(e.target.value) || 0)}
                                  />

                                  <label className="flex items-center gap-1 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={taxLine.isCompound || false}
                                      onChange={(e) => updateTaxLine(index, taxIndex, 'isCompound', e.target.checked)}
                                      className="rounded"
                                    />
                                    Compound
                                  </label>

                                  <label className="flex items-center gap-1 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={taxLine.isWithholding || false}
                                      onChange={(e) => updateTaxLine(index, taxIndex, 'isWithholding', e.target.checked)}
                                      className="rounded"
                                    />
                                    Withholding
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => removeTaxLine(index, taxIndex)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}

                              {(!item.taxLines || item.taxLines.length === 0) && (
                                <p className="text-sm text-gray-500 py-2">No tax lines. Click "Add Tax" to add taxes for this item.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  ${totals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (excl. WHT):</span>
                <span className="font-medium text-gray-900">${totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Total (before WHT):</span>
                <span className="font-medium text-gray-900">${totals.total.toFixed(2)}</span>
              </div>
              {totals.withholding > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Withholding Tax:</span>
                    <span className="font-medium text-red-600">-${totals.withholding.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 bg-blue-50 -mx-2 px-2 py-2 rounded">
                    <span className="text-gray-900">Amount Due (net of WHT):</span>
                    <span className="text-blue-600">${totals.amountDue.toFixed(2)}</span>
                  </div>
                </>
              )}
              {totals.withholding === 0 && (
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">${totals.total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
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
