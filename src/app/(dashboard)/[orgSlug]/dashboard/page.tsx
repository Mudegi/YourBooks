"use client";

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Package, Plus, CreditCard, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/currency';

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
  // Onboarding guard - redirects if setup incomplete
  const onboardingCheck = useOnboardingGuard();
  const { currency } = useOrganization();
  
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
  const quickAddRef = useRef<HTMLDivElement>(null);
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

  // Click outside handler for Quick Add menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setQuickAddOpen(false);
      }
    }

    if (quickAddOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickAddOpen]);

  const cards = stats
    ? [
        { title: 'Total Revenue', value: stats.revenue || 0, icon: DollarSign, color: 'blue' },
        { title: 'Payables', value: stats.payables || 0, icon: TrendingUp, color: 'red' },
        { title: 'Cash Balance', value: stats.cashBalance || 0, icon: DollarSign, color: 'green' },
        { title: 'Customers', value: stats.customers || 0, icon: Users, color: 'purple' },
        { title: 'Invoices', value: stats.invoices || 0, icon: FileText, color: 'yellow' },
        { title: 'Vendors', value: stats.vendors || 0, icon: Package, color: 'indigo' },
      ]
    : [];

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingDismissed', 'true');
    }
  };

  return (
    <div className="flex gap-6 pb-8">
      {/* Left Sidebar - Quick Actions */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2">Quick Actions</h2>
          
          <button
            onClick={() => window.location.href = `/${orgSlug}/accounts-receivable/invoices/new`}
            className="group w-full text-left bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Create Invoice</h3>
                <p className="text-xs text-gray-500 truncate">Bill a customer</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = `/${orgSlug}/payments/customer`}
            className="group w-full text-left bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors flex-shrink-0">
                <CreditCard className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Record Payment</h3>
                <p className="text-xs text-gray-500 truncate">Receive payment</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = `/${orgSlug}/accounts-payable/bills/new`}
            className="group w-full text-left bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors flex-shrink-0">
                <Package className="h-5 w-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Add Expense</h3>
                <p className="text-xs text-gray-500 truncate">Record a bill</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = `/${orgSlug}/general-ledger/journal-entries`}
            className="group w-full text-left bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-indigo-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors flex-shrink-0">
                <FileText className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Journal Entry</h3>
                <p className="text-xs text-gray-500 truncate">Manual entry</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* Hero Section with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
                <p className="text-blue-100 text-lg">Here's what's happening with your business today</p>
              </div>
              <div className="hidden lg:block">
                <div className="flex gap-3">
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                    <div className="text-white/80 text-xs font-medium">Today</div>
                    <div className="text-white text-lg font-bold mt-1">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Summary - Enhanced Design */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            Cash Flow Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Money In</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(45200, currency)}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12.5% from last month</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Money Out</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(28300, currency)}</p>
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>+8.2% from last month</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Net Cash Flow</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(16900, currency)}</p>
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Positive cash flow</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Recent Invoices
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {[
              { id: 'INV-2025-0012', customer: 'Acme Corp', amount: 5200, status: 'Paid', icon: CheckCircle2, color: 'green' },
              { id: 'INV-2025-0011', customer: 'Tech Solutions', amount: 3400, status: 'Pending', icon: Clock, color: 'yellow' },
              { id: 'INV-2025-0010', customer: 'Design Co', amount: 1800, status: 'Overdue', icon: AlertCircle, color: 'red' },
            ].map((invoice) => (
              <div key={invoice.id} className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${invoice.color}-100 rounded-lg flex items-center justify-center`}>
                    <invoice.icon className={`h-5 w-5 text-${invoice.color}-600`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{invoice.id}</div>
                    <div className="text-sm text-gray-600">{invoice.customer}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(invoice.amount, currency)}</div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                    invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {invoice.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Activity
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="group flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">Invoice INV-2025-0012 created</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  2 minutes ago
                </div>
              </div>
            </div>
            <div className="group flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">Payment received from Acme Corp</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  10 minutes ago
                </div>
              </div>
            </div>
            <div className="group flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">User John Doe invited</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  1 hour ago
                </div>
              </div>
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
      </div>

      {/* Quick Add Floating Action Button */}
      <div ref={quickAddRef} className="fixed bottom-8 right-8 z-50">
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
