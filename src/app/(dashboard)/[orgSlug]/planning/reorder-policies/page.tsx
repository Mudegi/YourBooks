'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Package, TrendingDown, TrendingUp, Plus } from 'lucide-react';

interface ReorderPolicy {
  id: string;
  product: { name: string; sku: string };
  warehouse?: { name: string };
  reorderPoint: number;
  minQty: number;
  maxQty: number;
  economicOrderQty?: number;
  leadTimeDays: number;
  isActive: boolean;
}

export default function ReorderPoliciesPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [policies, setPolicies] = useState<ReorderPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, [orgSlug]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`/api/${orgSlug}/planning/reorder-policies`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reorder policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.isActive).length;
  const avgLeadTime =
    policies.length > 0
      ? policies.reduce((sum, p) => sum + p.leadTimeDays, 0) / policies.length
      : 0;
  const avgEOQ =
    policies.filter(p => p.economicOrderQty).length > 0
      ? policies
          .filter(p => p.economicOrderQty)
          .reduce((sum, p) => sum + (p.economicOrderQty || 0), 0) /
        policies.filter(p => p.economicOrderQty).length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading reorder policies...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reorder Policies</h1>
          <p className="text-gray-500">Automatic reordering with min/max and EOQ</p>
        </div>
        <Button
          onClick={() => router.push(`/${orgSlug}/planning/reorder-policies/new`)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Reorder Policy
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Policies</p>
              <p className="text-2xl font-bold">{totalPolicies}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Policies</p>
              <p className="text-2xl font-bold">{activePolicies}</p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Lead Time</p>
              <p className="text-2xl font-bold">{avgLeadTime.toFixed(1)} days</p>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg EOQ</p>
              <p className="text-2xl font-bold">{avgEOQ.toFixed(0)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Reorder Policies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EOQ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No reorder policies found. Create your first reorder policy.
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr
                    key={policy.id}
                    onClick={() => router.push(`/${orgSlug}/planning/reorder-policies/${policy.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{policy.product.name}</div>
                      <div className="text-sm text-gray-500">{policy.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {policy.warehouse?.name || 'All Warehouses'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {policy.reorderPoint.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{policy.minQty.toFixed(0)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{policy.maxQty.toFixed(0)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {policy.economicOrderQty?.toFixed(0) || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{policy.leadTimeDays} days</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          policy.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
