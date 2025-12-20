'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';

interface Revaluation {
  id: string;
  number: string;
  product: { name: string; sku: string };
  oldCost: number;
  newCost: number;
  effectiveDate: string;
  reason: string;
  status: string;
  approvedBy?: { name: string };
  createdAt: string;
}

export default function RevaluationsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [revaluations, setRevaluations] = useState<Revaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevaluations();
  }, [orgSlug]);

  const fetchRevaluations = async () => {
    try {
      const response = await fetch(`/api/${orgSlug}/costing/revaluations`);
      if (response.ok) {
        const data = await response.json();
        setRevaluations(data);
      }
    } catch (error) {
      console.error('Error fetching revaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevaluations = revaluations.length;
  const approvedCount = revaluations.filter(r => r.status === 'APPROVED').length;
  const pendingCount = revaluations.filter(r => r.status === 'PENDING').length;
  const avgChange =
    revaluations.length > 0
      ? revaluations.reduce((sum, r) => sum + (r.newCost - r.oldCost), 0) / revaluations.length
      : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading revaluations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Revaluations</h1>
          <p className="text-gray-500">Adjust inventory costs with approval workflow</p>
        </div>
        <Button
          onClick={() => router.push(`/${orgSlug}/costing/revaluations/new`)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Revaluation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revaluations</p>
              <p className="text-2xl font-bold">{totalRevaluations}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold">{approvedCount}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Cost Change</p>
              <p className={`text-2xl font-bold ${avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(avgChange).toFixed(2)}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${avgChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </Card>
      </div>

      {/* Revaluations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Old Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revaluations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No revaluations found. Create your first cost revaluation.
                  </td>
                </tr>
              ) : (
                revaluations.map((rev) => {
                  const change = rev.newCost - rev.oldCost;
                  const changePercent = (change / rev.oldCost) * 100;
                  return (
                    <tr
                      key={rev.id}
                      onClick={() => router.push(`/${orgSlug}/costing/revaluations/${rev.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{rev.number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{rev.product.name}</div>
                        <div className="text-sm text-gray-500">{rev.product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">${rev.oldCost.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          ${rev.newCost.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            change >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {change >= 0 ? '+' : ''}${change.toFixed(2)} ({changePercent.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{rev.reason}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            rev.status
                          )}`}
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rev.effectiveDate).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
