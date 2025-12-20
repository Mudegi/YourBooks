'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

interface CostVariance {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  varianceType: string;
  standardAmount: number;
  actualAmount: number;
  varianceAmount: number;
  date: string;
}

export default function CostVariancesPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  
  const [variances, setVariances] = useState<CostVariance[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVariances();
  }, []);

  const fetchVariances = async () => {
    try {
      const response = await fetch(`/api/${orgSlug}/costing/variances`);
      if (response.ok) {
        const data = await response.json();
        setVariances(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching variances:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cost Variances</h1>
          <p className="text-gray-600 mt-1">Track and analyze cost variances</p>
        </div>
        <Link
          href={`/${orgSlug}/costing/variances/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record Variance
        </Link>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Variance</p>
                <p className={`text-2xl font-bold mt-1 ${summary.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${Math.abs(summary.totalVariance).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalVariance >= 0 ? 'Unfavorable' : 'Favorable'}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favorable Variances</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{summary.favorableVariances}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unfavorable Variances</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{summary.unfavorableVariances}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Variances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {variances.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No cost variances found</p>
                  <p className="text-sm mt-1">Record variances to track cost performance</p>
                </td>
              </tr>
            ) : (
              variances.map((variance) => (
                <tr key={variance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{variance.product.name}</div>
                      <div className="text-sm text-gray-500">{variance.product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {variance.varianceType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${variance.standardAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${variance.actualAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={variance.varianceAmount >= 0 ? 'text-red-600' : 'text-green-600'}>
                      ${Math.abs(variance.varianceAmount).toFixed(2)} {variance.varianceAmount >= 0 ? 'U' : 'F'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(variance.date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
