'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import Loading from '@/components/ui/loading';

interface Vendor {
  id: string;
  name: string;
  paymentTerms: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
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

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  accountId: string;
  taxLines?: TaxLine[];
  taxAmount: number;
}

export default function NewBillPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const preselectedVendorId = searchParams.get('vendorId');

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vendorId: preselectedVendorId || '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    billNumber: '',
    referenceNumber: '',
    notes: '',
  });

  const [items, setItems] = useState<BillItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      accountId: '',
      taxLines: [],
      taxAmount: 0,
    },
  ]);
  const [expandedTaxRows, setExpandedTaxRows] = useState<Set<string>>(new Set());
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchData();
  }, [orgSlug]);

  useEffect(() => {
    // Auto-calculate due date when vendor or bill date changes
    if (formData.vendorId && formData.billDate) {
      const vendor = vendors.find((v) => v.id === formData.vendorId);
      if (vendor) {
        calculateDueDate(formData.billDate, vendor.paymentTerms);
      }
    }
  }, [formData.vendorId, formData.billDate, vendors]);

  async function fetchData() {
    try {
      setLoading(true);
      const [vendorsRes, accountsRes] = await Promise.all([
        fetch(`/api/orgs/${orgSlug}/vendors?isActive=true`),
        fetch(`/api/orgs/${orgSlug}/chart-of-accounts`),
      ]);

      if (!vendorsRes.ok || !accountsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const vendorsData = await vendorsRes.json();
      const accountsData = await accountsRes.json();

      setVendors(vendorsData.vendors);
      // Filter for EXPENSE accounts only
      setExpenseAccounts(
        accountsData.accounts.filter(
          (acc: Account) => acc.accountType === 'EXPENSE' && acc.isActive !== false
        )
      );
    } catch (err) {
      setError('Failed to load vendors and accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function calculateDueDate(billDate: string, paymentTerms: string) {
    const date = new Date(billDate);
    let daysToAdd = 30; // default

    switch (paymentTerms) {
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

    date.setDate(date.getDate() + daysToAdd);
    setFormData((prev) => ({
      ...prev,
      dueDate: date.toISOString().split('T')[0],
    }));
  }

  function handleChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function addItem() {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        accountId: '',
        taxLines: [],
        taxAmount: 0,
      },
    ]);
  }

  function addTaxLine(itemId: string) {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              taxLines: [
                ...(item.taxLines || []),
                { taxType: 'STANDARD', rate: 0, compoundSequence: (item.taxLines?.length || 0) + 1 },
              ],
            }
          : item
      )
    );
  }

  function updateTaxLine(itemId: string, taxIndex: number, field: keyof TaxLine, value: any) {
    setItems(
      items.map((item) =>
        item.id === itemId && item.taxLines
          ? {
              ...item,
              taxLines: item.taxLines.map((line, idx) => (idx === taxIndex ? { ...line, [field]: value } : line)),
            }
          : item
      )
    );
  }

  function removeTaxLine(itemId: string, taxIndex: number) {
    setItems(
      items.map((item) =>
        item.id === itemId && item.taxLines
          ? {
              ...item,
              taxLines: item.taxLines.filter((_, idx) => idx !== taxIndex),
            }
          : item
      )
    );
  }

  function removeItem(id: string) {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  }

  function updateItem(id: string, field: keyof BillItem, value: any) {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function calculateLineTotal(item: BillItem): number {
    return item.quantity * item.unitPrice + item.taxAmount;
  }

  function calculateSubtotal(): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  function calculateTaxTotal(): number {
    return items.reduce((sum, item) => sum + item.taxAmount, 0);
  }

  function calculateTotal(): number {
    return calculateSubtotal() + calculateTaxTotal();
  }

  const validateField = (field: string, value: string) => {
    let error = '';
    if (field === 'vendorId' && !value) error = 'Vendor is required.';
    if (field === 'billDate' && !value) error = 'Bill date is required.';
    if (field === 'dueDate' && !value) error = 'Due date is required.';
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.vendorId) {
        throw new Error('Please select a vendor');
      }

      if (items.length === 0) {
        throw new Error('Please add at least one item');
      }

      // Validate all items have required fields
      for (const item of items) {
        if (!item.description) {
          throw new Error('All items must have a description');
        }
        if (!item.accountId) {
          throw new Error('All items must have an expense account');
        }
        if (item.quantity <= 0) {
          throw new Error('All items must have a positive quantity');
        }
      }

      const payload = {
        vendorId: formData.vendorId,
        billDate: formData.billDate,
        dueDate: formData.dueDate,
        billNumber: formData.billNumber || undefined,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        items: items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount || 0),
          accountId: item.accountId,
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
      };

      const response = await fetch(`/api/orgs/${orgSlug}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create bill');
      }

      const bill = await response.json();
      router.push(`/${orgSlug}/accounts-payable/bills/${bill.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href={`/${orgSlug}/accounts-payable/bills`}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to Bills
        </Link>
        <h1 className="text-3xl font-bold mt-2">Create New Bill</h1>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bill Header */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="vendorId">Vendor *</Label>
                <Select
                  id="vendorId"
                  value={formData.vendorId}
                  onChange={(e) => handleChange('vendorId', e.target.value)}
                  required
                >
                  <option value="">Select vendor...</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
                {formErrors.vendorId && <div className="text-xs text-red-600 mt-1">{formErrors.vendorId}</div>}
              </div>

              <div>
                <Label htmlFor="billNumber">Bill Number (optional)</Label>
                <Input
                  id="billNumber"
                  value={formData.billNumber}
                  onChange={(e) => handleChange('billNumber', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <Label htmlFor="billDate">Bill Date *</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => handleChange('billDate', e.target.value)}
                  required
                />
                {formErrors.billDate && <div className="text-xs text-red-600 mt-1">{formErrors.billDate}</div>}
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  required
                />
                {formErrors.dueDate && <div className="text-xs text-red-600 mt-1">{formErrors.dueDate}</div>}
              </div>

              <div className="col-span-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => handleChange('referenceNumber', e.target.value)}
                  placeholder="PO number or other reference"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                + Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg space-y-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-gray-600">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, 'description', e.target.value)
                        }
                        placeholder="Item description"
                        required
                      />
                    </div>

                    <div className="col-span-6">
                      <Label>Expense Account *</Label>
                      <Select
                        value={item.accountId}
                        onChange={(e) =>
                          updateItem(item.id, 'accountId', e.target.value)
                        }
                        required
                      >
                        <option value="">Select account...</option>
                        {expenseAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Tax</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.taxAmount}
                        onChange={(e) =>
                          updateItem(item.id, 'taxAmount', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm text-gray-600">Line Total: </span>
                    <span className="font-semibold">
                      ${calculateLineTotal(item).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Add any notes about this bill..."
            />
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${calculateTaxTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/${orgSlug}/accounts-payable/bills`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Bill'}
          </Button>
        </div>
      </form>
    </div>
  );
}
