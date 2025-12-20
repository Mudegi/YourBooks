'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  currentBalance: number;
}

interface Reconciliation {
  id: string;
  bankAccountId: string;
  bankAccountName?: string;
  accountNumber?: string;
  currency?: string;
  statementDate: string;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  status: string;
  notes?: string | null;
}

interface BankTransaction {
  id: string;
  bankFeedId?: string;
  transactionDate: string;
  amount: number;
  description: string;
  payee?: string | null;
  referenceNo?: string | null;
  transactionType: string;
  status: string;
  confidenceScore?: number | null;
  bankFeedName?: string;
  bankAccountName?: string;
  accountNumber?: string;
  currency?: string;
}

export default function BankReconciliationPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [rows, setRows] = useState<Reconciliation[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [txnFilter, setTxnFilter] = useState('PENDING');
  const [selectedFeedId, setSelectedFeedId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({
    bankAccountId: '',
    statementDate: '',
    statementBalance: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [orgSlug, txnFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, recRes, txnRes] = await Promise.all([
        fetch(`/api/${orgSlug}/banking/accounts`),
        fetch(`/api/${orgSlug}/banking/reconciliation`),
        fetch(`/api/${orgSlug}/banking/transactions?status=${txnFilter || ''}`),
      ]);

      if (accRes.ok) {
        const json = await accRes.json();
        setAccounts(json.data || []);
      }

      if (recRes.ok) {
        const json = await recRes.json();
        setRows(json.data || []);
      }

      if (txnRes.ok) {
        const json = await txnRes.json();
        setTransactions(json.data || []);
        const firstFeed = (json.data || []).find((t: any) => t.bankFeedId)?.bankFeedId;
        setSelectedFeedId(firstFeed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const autoMatch = async () => {
    setSaving(true);
    setError(null);
    try {
      const feedId = selectedFeedId || transactions.find((t) => t.bankFeedId)?.bankFeedId;
      if (!feedId) {
        throw new Error('No bank feed available to match');
      }
      const res = await fetch(`/api/${orgSlug}/bank-feeds/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankFeedId: feedId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Matching failed');
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Matching failed');
    } finally {
      setSaving(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/${orgSlug}/banking/reconciliation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          statementBalance: Number(form.statementBalance || 0),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to start reconciliation');
      }
      setForm({ bankAccountId: '', statementDate: '', statementBalance: '', notes: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start reconciliation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading reconciliation...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
        <p className="text-gray-600">Compare bank statements to book balances and resolve differences.</p>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bank Transactions</h2>
          <div className="flex items-center space-x-3">
            <select
              value={txnFilter}
              onChange={(e) => setTxnFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="MATCHED">Matched</option>
              <option value="RECONCILED">Reconciled</option>
            </select>
            <button
              onClick={loadData}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={autoMatch}
              disabled={saving}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Matching...' : 'Auto Match'}
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Account</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{new Date(t.transactionDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.amount.toFixed(2)} {t.currency || ''}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.transactionType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.bankAccountName || t.bankFeedName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.confidenceScore ? `${t.confidenceScore.toFixed(0)}%` : '—'}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={7}>
                    No transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">Start Reconciliation</h2>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={submit}>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Bank Account</label>
            <select
              name="bankAccountId"
              value={form.bankAccountId}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.accountNumber}) - {a.currency}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Statement Date</label>
            <input
              type="date"
              name="statementDate"
              value={form.statementDate}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Statement Balance</label>
            <input
              type="number"
              step="0.01"
              name="statementBalance"
              value={form.statementBalance}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={2}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Starting...' : 'Start'}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Account</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Statement</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Book</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Difference</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{new Date(r.statementDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.bankAccountName} ({r.accountNumber})</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.statementBalance.toFixed(2)} {r.currency}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.bookBalance.toFixed(2)} {r.currency}</td>
                <td className={`px-4 py-3 text-sm font-semibold ${r.difference === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                  {r.difference.toFixed(2)} {r.currency}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.status}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-600" colSpan={6}>
                  No reconciliations started yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
