"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Package, Plus, CreditCard } from 'lucide-react';
import { useParams } from 'next/navigation';

type Kpis = {
  revenue: number;
  payables: number;
  payments: number;
  invoices: number;
  bills: number;
  paymentsCount: number;
  customers: number;
  vendors: number;
  cashBalance: number;
};

export default function DashboardPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [stats, setStats] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('onboardingDismissed') !== 'true';
    }
    return true;
  });
  const [onboardingSteps, setOnboardingSteps] = useState([
    { label: 'Add your first customer', done: false },
    { label: 'Create your first invoice', done: false },
    { label: 'Record a payment', done: false },
    { label: 'Invite a team member', done: false },
  ]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const completed = onboardingSteps.filter(s => s.done).length;
  const total = onboardingSteps.length;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/${orgSlug}/dashboard/kpis`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load KPIs');
        setStats(data.kpis);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (orgSlug) load();
  }, [orgSlug]);

  const cards = stats
    ? [
        { title: 'Total Revenue', value: stats.revenue, icon: DollarSign, color: 'blue' },
        { title: 'Payables', value: stats.payables, icon: TrendingUp, color: 'red' },
        { title: 'Cash Balance', value: stats.cashBalance, icon: DollarSign, color: 'green' },
        { title: 'Customers', value: stats.customers, icon: Users, color: 'purple' },
        { title: 'Invoices', value: stats.invoices, icon: FileText, color: 'yellow' },
        { title: 'Vendors', value: stats.vendors, icon: Package, color: 'indigo' },
      ]
    : [];

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingDismissed', 'true');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your accounting overview</p>
      </div>

      {/* Stats Grid */}
      {loading && <div>Loading KPIs…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              red: 'bg-red-100 text-red-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              yellow: 'bg-yellow-100 text-yellow-600',
              indigo: 'bg-indigo-100 text-indigo-600',
            };

            return (
              <div key={card.title} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            onClick={() => window.location.href = `/${orgSlug}/accounts-receivable/invoices/new`}
          >
            <div className="font-semibold text-gray-900">Create Invoice</div>
            <div className="text-sm text-gray-600 mt-1">Bill a customer</div>
          </button>
          <button
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            onClick={() => window.location.href = `/${orgSlug}/payments/customer`}
          >
            <div className="font-semibold text-gray-900">Record Payment</div>
            <div className="text-sm text-gray-600 mt-1">Receive payment</div>
          </button>
          <button
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            onClick={() => window.location.href = `/${orgSlug}/accounts-payable/bills/new`}
          >
            <div className="font-semibold text-gray-900">Add Expense</div>
            <div className="text-sm text-gray-600 mt-1">Record a bill</div>
          </button>
          <button
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            onClick={() => window.location.href = `/${orgSlug}/general-ledger/journal-entries`}
          >
            <div className="font-semibold text-gray-900">Journal Entry</div>
            <div className="text-sm text-gray-600 mt-1">Manual entry</div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Invoices</h2>
          <div className="space-y-3">
            {[
              { id: 'INV-2025-0012', customer: 'Acme Corp', amount: 5200, status: 'Paid' },
              { id: 'INV-2025-0011', customer: 'Tech Solutions', amount: 3400, status: 'Pending' },
              { id: 'INV-2025-0010', customer: 'Design Co', amount: 1800, status: 'Overdue' },
            ].map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900">{invoice.id}</div>
                  <div className="text-sm text-gray-600">{invoice.customer}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${invoice.amount.toLocaleString()}</div>
                  <div className={`text-sm ${
                    invoice.status === 'Paid' ? 'text-green-600' :
                    invoice.status === 'Overdue' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {invoice.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Flow */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cash Flow Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Money In</div>
                <div className="text-2xl font-bold text-green-600">$45,200</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Money Out</div>
                <div className="text-2xl font-bold text-red-600">$28,300</div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Net Cash Flow</div>
                <div className="text-2xl font-bold text-blue-600">$16,900</div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Guided Onboarding Banner */}
      {showOnboarding && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow">
          <div>
            <div className="font-semibold text-blue-900 mb-1">Get started with YourBooks</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-700">Onboarding Progress:</span>
                <span className="font-bold text-blue-900">{completed}/{total}</span>
              </div>
              <div className="flex gap-2">
                {onboardingSteps.map((step, i) => (
                  <span key={i} className={`w-2 h-2 rounded-full ${step.done ? 'bg-blue-600' : 'bg-blue-200'}`}></span>
                ))}
              </div>
            </div>
            <ul className="mt-2 ml-4 list-disc text-sm text-blue-900">
              {onboardingSteps.map((step, i) => (
                <li key={i} className={step.done ? 'line-through text-blue-400' : ''}>{step.label}</li>
              ))}
            </ul>
          </div>
          <button onClick={dismissOnboarding} className="ml-4 text-blue-500 hover:text-blue-700 text-xs">Dismiss</button>
        </div>
      )}

      {/* Quick Add Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setQuickAddOpen(v => !v)}
          aria-label="Quick Add"
        >
          <Plus className="w-8 h-8" />
        </button>
        {quickAddOpen && (
          <div className="absolute bottom-16 right-0 w-56 bg-white border border-slate-200 rounded-lg shadow-xl p-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="font-semibold text-slate-700 px-2 mb-2">Quick Add</div>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-blue-50 text-slate-700"
              onClick={() => window.location.href = `/${orgSlug}/accounts-receivable/invoices/new`}
            >
              <FileText className="w-5 h-5 text-blue-500" /> Invoice
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-blue-50 text-slate-700"
              onClick={() => window.location.href = `/${orgSlug}/accounts-payable/bills/new`}
            >
              <Package className="w-5 h-5 text-indigo-500" /> Bill
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-blue-50 text-slate-700"
              onClick={() => window.location.href = `/${orgSlug}/payments/customer`}
            >
              <CreditCard className="w-5 h-5 text-green-500" /> Payment
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-blue-50 text-slate-700"
              onClick={() => window.location.href = `/${orgSlug}/accounts-receivable/customers`}
            >
              <Users className="w-5 h-5 text-purple-500" /> Customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
