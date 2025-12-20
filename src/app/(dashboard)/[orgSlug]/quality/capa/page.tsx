'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, FileText, Clock, CheckCircle, Plus } from 'lucide-react';

interface CAPA {
  id: string;
  number: string;
  title: string;
  type: string;
  ncr?: { number: string };
  status: string;
  priority: string;
  issueDescription: string;
  rootCause?: string;
  proposedAction?: string;
  assignedTo?: { name: string };
  targetCompletionDate?: string;
  createdAt: string;
}

const sampleCapas: CAPA[] = [
  {
    id: 'capa-001',
    number: 'CAPA-3101',
    title: 'Corrective: dimensional deviation fix',
    type: 'CORRECTIVE',
    ncr: { number: 'NCR-2305' },
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    issueDescription: 'Clamp fixture misalignment causing width variance',
    assignedTo: { name: 'QE - C. Musa' },
    targetCompletionDate: '2025-12-28',
    createdAt: '2025-12-18',
  },
  {
    id: 'capa-002',
    number: 'CAPA-3099',
    title: 'Preventive: supplier rust prevention SOP',
    type: 'PREVENTIVE',
    ncr: { number: 'NCR-2304' },
    status: 'OPEN',
    priority: 'URGENT',
    issueDescription: 'Rust spots in incoming lot; need supplier corrective plan',
    assignedTo: { name: 'SQE - J. Patel' },
    targetCompletionDate: '2026-01-05',
    createdAt: '2025-12-17',
  },
  {
    id: 'capa-003',
    number: 'CAPA-3095',
    title: 'Packaging tear mitigation',
    type: 'CORRECTIVE',
    ncr: { number: 'NCR-2301' },
    status: 'COMPLETED',
    priority: 'MEDIUM',
    issueDescription: 'Outer carton tears; reinforced corner protection added',
    assignedTo: { name: 'Ops - S. Kim' },
    targetCompletionDate: '2025-12-15',
    createdAt: '2025-12-10',
  },
];

export default function CAPAPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [capas, setCapas] = useState<CAPA[]>(sampleCapas);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCAPAs();
  }, [orgSlug]);

  const fetchCAPAs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${orgSlug}/quality/capa`);
      if (response.ok) {
        const data = await response.json();
        const records = data?.data || data;
        if (Array.isArray(records)) {
          setCapas(records);
        }
      }
    } catch (error) {
      console.error('Error fetching CAPAs, showing sample data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCAPAs = capas.length;
  const openCAPAs = capas.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;
  const completedCAPAs = capas.filter(c => c.status === 'COMPLETED').length;
  const correctiveActions = capas.filter(c => c.type === 'CORRECTIVE').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CORRECTIVE':
        return 'bg-red-100 text-red-800';
      case 'PREVENTIVE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading CAPA records...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Corrective & Preventive Actions (CAPA)
          </h1>
          <p className="text-gray-500">Manage corrective and preventive action plans</p>
        </div>
        <Button
          onClick={() => router.push(`/${orgSlug}/quality/capa/new`)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New CAPA
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total CAPAs</p>
              <p className="text-2xl font-bold">{totalCAPAs}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open/In Progress</p>
              <p className="text-2xl font-bold">{openCAPAs}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{completedCAPAs}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Corrective Actions</p>
              <p className="text-2xl font-bold">{correctiveActions}</p>
            </div>
            <Target className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* CAPAs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CAPA Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Related NCR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {capas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No CAPAs found. Create your first corrective/preventive action.
                  </td>
                </tr>
              ) : (
                capas.map((capa) => (
                  <tr
                    key={capa.id}
                    onClick={() => router.push(`/${orgSlug}/quality/capa/${capa.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{capa.number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{capa.title}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(
                          capa.type
                        )}`}
                      >
                        {capa.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                          capa.priority
                        )}`}
                      >
                        {capa.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          capa.status
                        )}`}
                      >
                        {capa.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{capa.ncr?.number || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{capa.assignedTo?.name || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {capa.targetCompletionDate
                        ? new Date(capa.targetCompletionDate).toLocaleDateString()
                        : '—'}
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
