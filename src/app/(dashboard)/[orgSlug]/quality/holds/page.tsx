'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ban, Package, Clock, CheckCircle, Plus } from 'lucide-react';

interface QualityHold {
  id: string;
  number: string;
  product: { name: string; sku: string };
  lotNumber?: string;
  quantityHeld: number;
  reason: string;
  holdType: string;
  status: string;
  disposition?: string;
  createdBy: { name: string };
  createdAt: string;
}

const sampleHolds: QualityHold[] = [
  {
    id: 'qh-001',
    number: 'HOLD-2301',
    product: { name: 'Finished Good X', sku: 'FGX-100' },
    lotNumber: 'LOT-9921',
    quantityHeld: 250,
    reason: 'Label mismatch',
    holdType: 'QUALITY',
    status: 'ACTIVE',
    createdBy: { name: 'Quality - J. Singh' },
    createdAt: '2025-12-18',
  },
  {
    id: 'qh-002',
    number: 'HOLD-2298',
    product: { name: 'Raw Material A', sku: 'RMA-001' },
    lotNumber: 'LOT-8819',
    quantityHeld: 120,
    reason: 'COA missing',
    holdType: 'SUPPLIER_ISSUE',
    status: 'RELEASED',
    disposition: 'Release after COA uploaded',
    createdBy: { name: 'Receiving - M. Okello' },
    createdAt: '2025-12-16',
  },
  {
    id: 'qh-003',
    number: 'HOLD-2291',
    product: { name: 'Component B', sku: 'COMP-222' },
    lotNumber: 'LOT-8775',
    quantityHeld: 80,
    reason: 'Dimensional deviation',
    holdType: 'QUALITY',
    status: 'REWORKED',
    disposition: 'Rework with updated fixture',
    createdBy: { name: 'Manufacturing - P. Zhang' },
    createdAt: '2025-12-14',
  },
];

export default function QualityHoldsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [holds, setHolds] = useState<QualityHold[]>(sampleHolds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHolds();
  }, [orgSlug]);

  const fetchHolds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${orgSlug}/quality/holds`);
      if (response.ok) {
        const data = await response.json();
        const records = data?.data || data;
        if (Array.isArray(records)) {
          setHolds(records);
        }
      }
    } catch (error) {
      console.error('Error fetching quality holds, showing sample data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHolds = holds.length;
  const activeHolds = holds.filter(h => h.status === 'ACTIVE').length;
  const releasedHolds = holds.filter(h => h.status === 'RELEASED').length;
  const totalQtyHeld = holds
    .filter(h => h.status === 'ACTIVE')
    .reduce((sum, h) => sum + h.quantityHeld, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-100 text-red-800';
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'SCRAPPED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHoldTypeColor = (type: string) => {
    switch (type) {
      case 'QUALITY':
        return 'bg-orange-100 text-orange-800';
      case 'REGULATORY':
        return 'bg-purple-100 text-purple-800';
      case 'CUSTOMER_COMPLAINT':
        return 'bg-red-100 text-red-800';
      case 'SUPPLIER_ISSUE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading quality holds...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Holds</h1>
          <p className="text-gray-500">Manage inventory holds and dispositions</p>
        </div>
        <Button
          onClick={() => router.push(`/${orgSlug}/quality/holds/new`)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Quality Hold
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Holds</p>
              <p className="text-2xl font-bold">{totalHolds}</p>
            </div>
            <Ban className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Holds</p>
              <p className="text-2xl font-bold">{activeHolds}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Released</p>
              <p className="text-2xl font-bold">{releasedHolds}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Qty on Hold</p>
              <p className="text-2xl font-bold">{totalQtyHeld.toFixed(0)}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Quality Holds Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hold Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lot Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hold Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disposition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No quality holds found. Create your first quality hold.
                  </td>
                </tr>
              ) : (
                holds.map((hold) => (
                  <tr
                    key={hold.id}
                    onClick={() => router.push(`/${orgSlug}/quality/holds/${hold.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{hold.number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{hold.product.name}</div>
                      <div className="text-sm text-gray-500">{hold.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{hold.lotNumber || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {hold.quantityHeld.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getHoldTypeColor(
                          hold.holdType
                        )}`}
                      >
                        {hold.holdType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{hold.reason}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          hold.status
                        )}`}
                      >
                        {hold.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{hold.disposition || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(hold.createdAt).toLocaleDateString()}
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
