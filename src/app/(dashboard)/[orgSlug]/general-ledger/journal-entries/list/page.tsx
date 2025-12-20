'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  transactionDate: string;
  description: string;
  reference: string | null;
  status: string;
  ledgerEntries: Array<{
    id: string;
    entryType: string;
    amount: number;
    account: {
      code: string;
      name: string;
      type: string;
    };
  }>;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function TransactionsListPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchTransactions();
  }, [orgSlug, filterType]);

  const fetchTransactions = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterType !== 'ALL') queryParams.append('type', filterType);

      const response = await fetch(`/api/orgs/${orgSlug}/transactions?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm('Are you sure you want to void this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/orgs/${orgSlug}/transactions/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchTransactions();
      } else {
        alert(data.error || 'Failed to void transaction');
      }
    } catch (error) {
      console.error('Error voiding transaction:', error);
      alert('Failed to void transaction');
    }
  };

  const calculateTotalAmount = (transaction: Transaction) => {
    return transaction.ledgerEntries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((sum, e) => sum + e.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">View all posted transactions</p>
        </div>
        <Link
          href={`/${orgSlug}/general-ledger/journal-entries`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Entry
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="JOURNAL">Journal Entry</option>
            <option value="INVOICE">Invoice</option>
            <option value="BILL">Bill</option>
            <option value="PAYMENT">Payment</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No transactions found</p>
            <Link
              href={`/${orgSlug}/general-ledger/journal-entries`}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create your first journal entry
            </Link>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-lg shadow">
              {/* Transaction Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transaction.reference || `JE-${transaction.id.slice(0, 8)}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'POSTED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {transaction.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-1">{transaction.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Date: {new Date(transaction.transactionDate).toLocaleDateString()}
                      </span>
                      <span>
                        Posted by: {transaction.createdBy.firstName} {transaction.createdBy.lastName}
                      </span>
                      <span>Amount: ${calculateTotalAmount(transaction).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${orgSlug}/general-ledger/transactions/${transaction.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    {transaction.status !== 'VOIDED' && (
                      <button
                        onClick={() => handleVoid(transaction.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Void Transaction"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ledger Entries */}
              <div className="p-6">
                <table className="w-full">
                  <thead className="text-sm text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="text-left pb-2">Account</th>
                      <th className="text-right pb-2">Debit</th>
                      <th className="text-right pb-2">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transaction.ledgerEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-2">
                          <span className="font-mono text-sm text-gray-500 mr-2">
                            {entry.account.code}
                          </span>
                          <span className="text-gray-900">{entry.account.name}</span>
                        </td>
                        <td className="py-2 text-right text-gray-900">
                          {entry.entryType === 'DEBIT' && `$${entry.amount.toLocaleString()}`}
                        </td>
                        <td className="py-2 text-right text-gray-900">
                          {entry.entryType === 'CREDIT' && `$${entry.amount.toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
