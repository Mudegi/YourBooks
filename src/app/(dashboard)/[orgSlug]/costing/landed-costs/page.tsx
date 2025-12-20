'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, TrendingUp, Plus } from 'lucide-react';

interface LandedCost {
  id: string;
  number: string;
  receiptNumber: string;
  totalAmount: number;
  allocationStatus: string;
  items: Array<{
    id: string;
    product: { name: string };
    quantity: number;
    allocatedAmount: number;
  }>;
  createdAt: string;
}

export default function LandedCostsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [landedCosts, setLandedCosts] = useState<LandedCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandedCosts();
  }, [orgSlug]);

  const fetchLandedCosts = async () => {
    try {
      const response = await fetch(`/api/${orgSlug}/costing/landed-costs`);
      if (response.ok) {
        const data = await response.json();
        setLandedCosts(data);
      }
    } catch (error) {
      console.error('Error fetching landed costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = landedCosts.reduce((sum, lc) => sum + lc.totalAmount, 0);
  const totalAllocations = landedCosts.reduce((sum, lc) => sum + lc.items.length, 0);
  const completedCount = landedCosts.filter(lc => lc.allocationStatus === 'COMPLETED').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading landed costs...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Landed Costs</h1>
          <p className="text-gray-500">Allocate additional costs to inventory receipts</p>
        </div>
        <Button
          onClick={() => router.push(`/${orgSlug}/costing/landed-costs/new`)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Landed Cost
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Landed Costs</p>
              <p className="text-2xl font-bold">{landedCosts.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Allocations</p>
              <p className="text-2xl font-bold">{totalAllocations}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Landed Costs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {landedCosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No landed costs found. Create your first landed cost allocation.
                  </td>
                </tr>
              ) : (
                landedCosts.map((lc) => (
                  <tr
                    key={lc.id}
                    onClick={() => router.push(`/${orgSlug}/costing/landed-costs/${lc.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{lc.number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{lc.receiptNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        ${lc.totalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{lc.items.length} items</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          lc.allocationStatus
                        )}`}
                      >
                        {lc.allocationStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lc.createdAt).toLocaleDateString()}
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
