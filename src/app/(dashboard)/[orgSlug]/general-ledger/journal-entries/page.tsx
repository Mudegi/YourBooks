'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface LedgerEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

export default function JournalEntriesPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [entries, setEntries] = useState<LedgerEntry[]>([
    { accountId: '', accountCode: '', accountName: '', entryType: 'DEBIT', amount: '' },
    { accountId: '', accountCode: '', accountName: '', entryType: 'CREDIT', amount: '' },
  ]);
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [orgSlug]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/orgs/${orgSlug}/chart-of-accounts?isActive=true`);
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      { accountId: '', accountCode: '', accountName: '', entryType: 'DEBIT', amount: '' },
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof LedgerEntry, value: string) => {
    const newEntries = [...entries];
    
    if (field === 'accountId') {
      const account = accounts.find((a) => a.id === value);
      if (account) {
        newEntries[index] = {
          ...newEntries[index],
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
        };
      }
    } else {
      newEntries[index] = { ...newEntries[index], [field]: value };
    }
    
    setEntries(newEntries);
  };

  // Calculate totals
  const totalDebits = entries
    .filter((e) => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const totalCredits = entries
    .filter((e) => e.entryType === 'CREDIT')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const isBalanced = totalDebits === totalCredits && totalDebits > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!isBalanced) {
      setError('Transaction must be balanced (Debits = Credits)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/orgs/${orgSlug}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'JOURNAL',
          transactionDate,
          description,
          reference: reference || undefined,
          entries: entries.map((e) => ({
            accountId: e.accountId,
            entryType: e.entryType,
            amount: parseFloat(e.amount),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      setSuccess(true);
      
      // Reset form
      setDescription('');
      setReference('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setEntries([
        { accountId: '', accountCode: '', accountName: '', entryType: 'DEBIT', amount: '' },
        { accountId: '', accountCode: '', accountName: '', entryType: 'CREDIT', amount: '' },
      ]);

      // Redirect to transactions list after a delay
      setTimeout(() => {
        router.push(`/${orgSlug}/general-ledger/journal-entries/list`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
        <p className="text-gray-600 mt-1">Record manual accounting transactions</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Transaction created successfully! Redirecting...
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Date
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="JE-2025-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the transaction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ledger Entries</h2>
            <button
              type="button"
              onClick={addEntry}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
            >
              <Plus className="h-5 w-5 mr-1" />
              Add Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Account
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Credit
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={entry.accountId}
                        onChange={(e) => updateEntry(index, 'accountId', e.target.value)}
                      >
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={entry.entryType}
                        onChange={(e) => updateEntry(index, 'entryType', e.target.value)}
                      >
                        <option value="DEBIT">Debit</option>
                        <option value="CREDIT">Credit</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {entry.entryType === 'DEBIT' && (
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                          placeholder="0.00"
                          value={entry.amount}
                          onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.entryType === 'CREDIT' && (
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                          placeholder="0.00"
                          value={entry.amount}
                          onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        disabled={entries.length <= 2}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right font-bold text-gray-900">
                    Totals:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ${totalDebits.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ${totalCredits.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance Warning */}
          {!isBalanced && (totalDebits > 0 || totalCredits > 0) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-800">Transaction Not Balanced</div>
                <div className="text-sm text-yellow-700 mt-1">
                  Debits must equal Credits. Difference: $
                  {Math.abs(totalDebits - totalCredits).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isBalanced && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <div className="text-green-800 font-semibold">
                ✓ Transaction is balanced and ready to post
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(`/${orgSlug}/general-ledger/journal-entries/list`)}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isBalanced || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
