'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import Loading from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CashFlowData {
  startDate: string;
  endDate: string;
  operatingActivities: {
    netIncome: number;
    adjustments: { description: string; amount: number }[];
    totalOperating: number;
  };
  investingActivities: {
    activities: { description: string; amount: number }[];
    totalInvesting: number;
  };
  financingActivities: {
    activities: { description: string; amount: number }[];
    totalFinancing: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export default function CashFlowPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    fetchCashFlow();
  }, [startDate, endDate]);

  async function fetchCashFlow() {
    try {
      setLoading(true);
      const url = `/api/orgs/${orgSlug}/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch cash flow');
      
      const data = await response.json();
      setCashFlow(data);
    } catch (err) {
      setError('Failed to load cash flow statement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !cashFlow) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error || 'Failed to load cash flow statement'}</Alert>
        <Link href={`/${orgSlug}/reports`}>
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
          <p className="text-gray-600 mt-1">Statement of Cash Flows</p>
        </div>
        <div className="flex gap-2 items-end">
          <div>
            <Label htmlFor="startDate">Start Date:</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date:</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" onClick={handlePrint}>
            Print Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-2xl">Cash Flow Statement</CardTitle>
            <p className="text-gray-600">
              {new Date(cashFlow.startDate).toLocaleDateString()} -{' '}
              {new Date(cashFlow.endDate).toLocaleDateString()}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* OPERATING ACTIVITIES */}
            <div>
              <h2 className="text-xl font-bold border-b-2 pb-2 mb-4">
                CASH FLOWS FROM OPERATING ACTIVITIES
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 pl-4">Net Income</td>
                    <td className="py-1 text-right pr-4">
                      ${cashFlow.operatingActivities.netIncome.toFixed(2)}
                    </td>
                  </tr>
                  {cashFlow.operatingActivities.adjustments.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={2} className="py-2 pl-4 font-semibold text-gray-700">
                          Adjustments to reconcile net income:
                        </td>
                      </tr>
                      {cashFlow.operatingActivities.adjustments.map((adj, index) => (
                        <tr key={index}>
                          <td className="py-1 pl-8">{adj.description}</td>
                          <td className="py-1 text-right pr-4">
                            <span className={adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {adj.amount >= 0 ? '+' : ''}${adj.amount.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                  <tr className="border-t-2 font-bold">
                    <td className="py-2 pl-4">Net Cash from Operating Activities</td>
                    <td className="py-2 text-right pr-4">
                      <span
                        className={
                          cashFlow.operatingActivities.totalOperating >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        ${cashFlow.operatingActivities.totalOperating.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* INVESTING ACTIVITIES */}
            <div>
              <h2 className="text-xl font-bold border-b-2 pb-2 mb-4">
                CASH FLOWS FROM INVESTING ACTIVITIES
              </h2>
              {cashFlow.investingActivities.activities.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {cashFlow.investingActivities.activities.map((activity, index) => (
                      <tr key={index}>
                        <td className="py-1 pl-4">{activity.description}</td>
                        <td className="py-1 text-right pr-4">
                          <span className={activity.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {activity.amount >= 0 ? '+' : ''}${activity.amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold">
                      <td className="py-2 pl-4">Net Cash from Investing Activities</td>
                      <td className="py-2 text-right pr-4">
                        <span
                          className={
                            cashFlow.investingActivities.totalInvesting >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          ${cashFlow.investingActivities.totalInvesting.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center py-4">No investing activities recorded</p>
              )}
            </div>

            {/* FINANCING ACTIVITIES */}
            <div>
              <h2 className="text-xl font-bold border-b-2 pb-2 mb-4">
                CASH FLOWS FROM FINANCING ACTIVITIES
              </h2>
              {cashFlow.financingActivities.activities.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {cashFlow.financingActivities.activities.map((activity, index) => (
                      <tr key={index}>
                        <td className="py-1 pl-4">{activity.description}</td>
                        <td className="py-1 text-right pr-4">
                          <span className={activity.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {activity.amount >= 0 ? '+' : ''}${activity.amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold">
                      <td className="py-2 pl-4">Net Cash from Financing Activities</td>
                      <td className="py-2 text-right pr-4">
                        <span
                          className={
                            cashFlow.financingActivities.totalFinancing >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          ${cashFlow.financingActivities.totalFinancing.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center py-4">No financing activities recorded</p>
              )}
            </div>

            {/* NET CHANGE IN CASH */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <table className="w-full">
                <tbody>
                  <tr className="text-lg font-bold">
                    <td>NET CHANGE IN CASH</td>
                    <td className="text-right">
                      <span
                        className={
                          cashFlow.netCashFlow >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        ${cashFlow.netCashFlow.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CASH RECONCILIATION */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-bold mb-4 text-center">Cash Reconciliation</h3>
              <table className="w-full">
                <tbody>
                  <tr className="text-sm">
                    <td className="py-2">Beginning Cash Balance</td>
                    <td className="py-2 text-right font-semibold">
                      ${cashFlow.beginningCash.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="text-sm">
                    <td className="py-2">Net Change in Cash</td>
                    <td className="py-2 text-right font-semibold">
                      <span
                        className={
                          cashFlow.netCashFlow >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {cashFlow.netCashFlow >= 0 ? '+' : ''}${cashFlow.netCashFlow.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t-2 border-blue-300 text-xl font-bold">
                    <td className="py-3">Ending Cash Balance</td>
                    <td className="py-3 text-right text-blue-600">
                      ${cashFlow.endingCash.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 text-xs text-gray-600 text-center">
                <p>
                  ${cashFlow.beginningCash.toFixed(2)} +{' '}
                  {cashFlow.netCashFlow >= 0 ? '+' : ''}${cashFlow.netCashFlow.toFixed(2)} ={' '}
                  <span className="font-bold">${cashFlow.endingCash.toFixed(2)}</span>
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Operating Cash Flow</p>
                <p className="text-xl font-bold text-green-600">
                  ${cashFlow.operatingActivities.totalOperating.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Investing Cash Flow</p>
                <p className="text-xl font-bold text-blue-600">
                  ${cashFlow.investingActivities.totalInvesting.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <p className="text-sm text-gray-600">Financing Cash Flow</p>
                <p className="text-xl font-bold text-purple-600">
                  ${cashFlow.financingActivities.totalFinancing.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
