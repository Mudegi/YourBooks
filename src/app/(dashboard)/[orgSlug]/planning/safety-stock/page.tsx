'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Package, AlertTriangle, TrendingUp, Plus } from 'lucide-react';

interface SafetyStock {
  id: string;
  product: { name: string; sku: string };
  warehouse?: { name: string };
  safetyStockQty: number;
  calculationMethod: string;
  serviceLevel: number;
  leadTimeDays: number;
  demandStdDev: number;
  lastCalculatedAt: string;
}

export default function SafetyStockPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [safetyStocks, setSafetyStocks] = useState<SafetyStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSafetyStocks();
  }, [orgSlug]);

  const fetchSafetyStocks = async () => {
    try {
      const response = await fetch(`/api/${orgSlug}/planning/safety-stock`);
      if (response.ok) {
        const data = await response.json();
        setSafetyStocks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching safety stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = safetyStocks.length;
  const avgServiceLevel =
    safetyStocks.length > 0
      ? safetyStocks.reduce((sum, ss) => sum + ss.serviceLevel, 0) / safetyStocks.length
      : 0;
  const avgLeadTime =
    safetyStocks.length > 0
      ? safetyStocks.reduce((sum, ss) => sum + ss.leadTimeDays, 0) / safetyStocks.length
      : 0;
  const totalSafetyQty = safetyStocks.reduce((sum, ss) => sum + ss.safetyStockQty, 0);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'FIXED':
        return 'bg-gray-100 text-gray-800';
      case 'TIME_BASED':
        return 'bg-blue-100 text-blue-800';
      case 'STATISTICAL':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading safety stock rules...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Safety Stock</h1>
          <p className="text-gray-500">Maintain buffer inventory to prevent stockouts</p>
        </div>
        <Button
          onClick={() => router.push(`/${orgSlug}/planning/safety-stock/new`)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Safety Stock Rule
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Products with Safety Stock</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Service Level</p>
              <p className="text-2xl font-bold">{avgServiceLevel.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Lead Time</p>
              <p className="text-2xl font-bold">{avgLeadTime.toFixed(1)} days</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Safety Qty</p>
              <p className="text-2xl font-bold">{totalSafetyQty.toFixed(0)}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Safety Stock Table */}
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
                  Safety Stock Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Calculated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safetyStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No safety stock rules found. Create your first safety stock rule.
                  </td>
                </tr>
              ) : (
                safetyStocks.map((ss) => (
                  <tr
                    key={ss.id}
                    onClick={() => router.push(`/${orgSlug}/planning/safety-stock/${ss.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ss.product.name}</div>
                      <div className="text-sm text-gray-500">{ss.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {ss.warehouse?.name || 'All Warehouses'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {ss.safetyStockQty.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodColor(
                          ss.calculationMethod
                        )}`}
                      >
                        {ss.calculationMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ss.serviceLevel.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ss.leadTimeDays} days</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ss.lastCalculatedAt).toLocaleDateString()}
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
