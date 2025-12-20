'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, TrendingUp, DollarSign, Package } from 'lucide-react';

interface StandardCost {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  costingMethod: string;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export default function StandardCostsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  
  const [standardCosts, setStandardCosts] = useState<StandardCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandardCosts();
  }, []);

  const fetchStandardCosts = async () => {
    try {
      const response = await fetch(`/api/${orgSlug}/costing/standard-costs`);
      if (response.ok) {
        const data = await response.json();
        setStandardCosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching standard costs:', error);
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
          <h1 className="text-3xl font-bold">Standard Costs</h1>
          <p className="text-gray-600 mt-1">Manage product standard costs and costing methods</p>
        </div>
        <Link
          href={`/${orgSlug}/costing/standard-costs/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Standard Cost
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold mt-1">{standardCosts.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Material Cost</p>
              <p className="text-2xl font-bold mt-1">
                ${standardCosts.length > 0 
                  ? (standardCosts.reduce((sum, sc) => sum + sc.materialCost, 0) / standardCosts.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Total Cost</p>
              <p className="text-2xl font-bold mt-1">
                ${standardCosts.length > 0 
                  ? (standardCosts.reduce((sum, sc) => sum + sc.totalCost, 0) / standardCosts.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Standard Costs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costing Method</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Labor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Overhead</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standardCosts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No standard costs found</p>
                  <p className="text-sm mt-1">Create your first standard cost to get started</p>
                </td>
              </tr>
            ) : (
              standardCosts.map((sc) => (
                <tr key={sc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{sc.product.name}</div>
                      <div className="text-sm text-gray-500">{sc.product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {sc.costingMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${sc.materialCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${sc.laborCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${sc.overheadCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    ${sc.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sc.effectiveFrom).toLocaleDateString()}
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
