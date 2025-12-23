'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  CreditCard,
  Building2,
  Package,
  Factory,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  UserCheck,
  Wrench,
  Briefcase,
  BarChart3,
  CheckSquare,
  Plug,
  Shield,
  Database,
  DollarSign,
  LineChart,
  ClipboardCheck,
  MapPin,
  Lock,
} from 'lucide-react';
import { hasFeature, getTierDisplayName, getTierBadgeColor, type PackageTier } from '@/lib/package-features';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  package?: PackageTier;
  onboardingCompleted?: boolean;
  industry?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSession();
    
    // Close mobile menu on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 10);
      }
      if (e.key === 'g') {
        (window as any).__pendingShortcut = true;
        setTimeout(() => ((window as any).__pendingShortcut = false), 500);
      }
      if ((window as any).__pendingShortcut && e.key === 'i') {
        router.push(`/${orgSlug}/accounts-receivable/invoices`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orgSlug, router]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
        setOrganization(data.data.organization);
        
        // Check if onboarding is completed
        if (data.data.organization && !data.data.organization.onboardingCompleted) {
          router.push('/onboarding');
          return;
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Session fetch error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const orgPackage = organization?.package || 'ADVANCED';

  const navigation = [
    {
      name: 'Dashboard',
      href: `/${orgSlug}/dashboard`,
      icon: LayoutDashboard,
      featureKey: 'dashboard',
    },
    {
      name: 'Financial Overview',
      href: `/${orgSlug}/dashboard/financial`,
      icon: TrendingUp,
      featureKey: 'dashboard',
    },
    {
      name: 'General Ledger',
      icon: BookOpen,
      featureKey: 'general-ledger',
      children: [
        { name: 'Chart of Accounts', href: `/${orgSlug}/general-ledger/chart-of-accounts` },
        { name: 'Journal Entries', href: `/${orgSlug}/general-ledger/journal-entries/list` },
        { name: 'New Entry', href: `/${orgSlug}/general-ledger/journal-entries` },
      ],
    },
    {
      name: 'Accounts Receivable',
      icon: Users,
      featureKey: 'accounts-receivable',
      children: [
        { name: 'Customers', href: `/${orgSlug}/accounts-receivable/customers` },
        { name: 'Invoices', href: `/${orgSlug}/accounts-receivable/invoices` },
        { name: 'New Invoice', href: `/${orgSlug}/accounts-receivable/invoices/new` },
      ],
    },
    {
      name: 'Accounts Payable',
      icon: FileText,
      featureKey: 'accounts-payable',
      children: [
        { name: 'Vendors', href: `/${orgSlug}/accounts-payable/vendors` },
        { name: 'Bills', href: `/${orgSlug}/accounts-payable/bills` },
        { name: 'New Bill', href: `/${orgSlug}/accounts-payable/bills/new` },
      ],
    },
    {
      name: 'Payments',
      icon: CreditCard,
      featureKey: 'payments',
      children: [
        { name: 'All Payments', href: `/${orgSlug}/payments` },
        { name: 'Customer Payment', href: `/${orgSlug}/payments/customer` },
        { name: 'Vendor Payment', href: `/${orgSlug}/payments/vendor` },
      ],
    },
    {
      name: 'Banking',
      icon: Building2,
      featureKey: 'banking',
      children: [
        { name: 'Bank Accounts', href: `/${orgSlug}/banking/accounts` },
        { name: 'Transfer Funds', href: `/${orgSlug}/banking/transfers` },
        { name: 'Reconciliation', href: `/${orgSlug}/banking/reconciliation` },
      ],
    },
    {
      name: 'Inventory',
      icon: Package,
      featureKey: 'inventory',
      children: [
        { name: 'Products', href: `/${orgSlug}/inventory/products` },
        { name: 'Stock Movements', href: `/${orgSlug}/inventory/movements` },
        { name: 'Adjustments', href: `/${orgSlug}/inventory/adjustments` },
      ],
    },
    {
      name: 'Reports',
      icon: TrendingUp,
      featureKey: 'reports',
      children: [
        { name: 'All Reports', href: `/${orgSlug}/reports` },
        { name: 'Balance Sheet', href: `/${orgSlug}/reports/balance-sheet` },
        { name: 'Profit & Loss', href: `/${orgSlug}/reports/profit-loss` },
        { name: 'Cash Flow', href: `/${orgSlug}/reports/cash-flow` },
        { name: 'Trial Balance', href: `/${orgSlug}/reports/trial-balance` },
        { name: 'Aged Receivables', href: `/${orgSlug}/reports/aged-receivables` },
        { name: 'Aged Payables', href: `/${orgSlug}/reports/aged-payables` },
      ],
    },
    {
      name: 'Banking & Operations',
      icon: Settings,
      featureKey: 'bank-feeds',
      children: [
        { name: 'Bank Feeds', href: `/${orgSlug}/bank-feeds` },
        { name: 'Documents', href: `/${orgSlug}/documents` },
        { name: 'Projects', href: `/${orgSlug}/projects` },
      ],
    },
    {
      name: 'CRM',
      icon: Briefcase,
      featureKey: 'crm',
      children: [
        { name: 'Companies', href: `/${orgSlug}/crm/companies` },
        { name: 'Contacts', href: `/${orgSlug}/crm/contacts` },
        { name: 'Sales Pipeline', href: `/${orgSlug}/crm/opportunities` },
      ],
    },
    {
      name: 'Warehouse',
      icon: Building2,
      featureKey: 'warehouse',
      children: [
        { name: 'Warehouses', href: `/${orgSlug}/warehouse/warehouses` },
        { name: 'Transfer Orders', href: `/${orgSlug}/warehouse/transfer-orders` },
      ],
    },
    {
      name: 'Manufacturing',
      icon: Factory,
      featureKey: 'manufacturing',
      children: [
        { name: 'BOMs', href: `/${orgSlug}/manufacturing/boms` },
        { name: 'Work Orders', href: `/${orgSlug}/manufacturing/work-orders` },
      ],
    },
    {
      name: 'HCM / Payroll',
      icon: UserCheck,
      featureKey: 'hcm',
      children: [
        { name: 'Employees', href: `/${orgSlug}/hcm/employees` },
        { name: 'Leave Requests', href: `/${orgSlug}/hcm/leave-requests` },
        { name: 'Expense Claims', href: `/${orgSlug}/hcm/expense-claims` },
      ],
    },
    {
      name: 'Field Service',
      icon: Briefcase,
      featureKey: 'field-service',
      children: [
        { name: 'Work Orders', href: `/${orgSlug}/field-service/work-orders` },
      ],
    },
    {
      name: 'Maintenance',
      icon: Wrench,
      featureKey: 'maintenance',
      children: [
        { name: 'Work Orders', href: `/${orgSlug}/maintenance/work-orders` },
      ],
    },
    {
      name: 'Reporting & BI',
      icon: BarChart3,
      featureKey: 'advanced-reporting',
      children: [
        { name: 'Reports', href: `/${orgSlug}/reporting/reports` },
        { name: 'Dashboards', href: `/${orgSlug}/reporting/dashboards` },
      ],
    },
    {
      name: 'Workflows',
      icon: CheckSquare,
      featureKey: 'workflows',
      children: [
        { name: 'Approval Inbox', href: `/${orgSlug}/workflows/approvals` },
        { name: 'Workflow Designer', href: `/${orgSlug}/workflows/designer` },
      ],
    },
    {
      name: 'Integrations',
      icon: Plug,
      featureKey: 'integrations',
      children: [
        { name: 'Integrations', href: `/${orgSlug}/integrations` },
        { name: 'Webhooks', href: `/${orgSlug}/integrations/webhooks` },
      ],
    },
    {
      name: 'Security & MDM',
      icon: Shield,
      featureKey: 'security-mdm',
      children: [
        { name: 'Price Lists', href: `/${orgSlug}/mdm/price-lists` },
        { name: 'Discounts', href: `/${orgSlug}/mdm/discounts` },
        { name: 'Audit Logs', href: `/${orgSlug}/security/audit-logs` },
      ],
    },
    {
      name: 'Inventory Advanced',
      icon: Database,
      featureKey: 'inventory-advanced',
      children: [
        { name: 'Cycle Counts', href: `/${orgSlug}/inventory/cycle-counts` },
        { name: 'Lot Tracking', href: `/${orgSlug}/inventory/lots` },
        { name: 'Valuations', href: `/${orgSlug}/inventory/valuations` },
      ],
    },
    {
      name: 'Costing',
      icon: DollarSign,
      featureKey: 'costing',
      children: [
        { name: 'Standard Costs', href: `/${orgSlug}/costing/standard-costs` },
        { name: 'Cost Variances', href: `/${orgSlug}/costing/variances` },
        { name: 'Landed Costs', href: `/${orgSlug}/costing/landed-costs` },
        { name: 'Revaluations', href: `/${orgSlug}/costing/revaluations` },
      ],
    },
    {
      name: 'Planning',
      icon: LineChart,
      featureKey: 'planning',
      children: [
        { name: 'Demand Forecasts', href: `/${orgSlug}/planning/forecasts` },
        { name: 'Safety Stock', href: `/${orgSlug}/planning/safety-stock` },
        { name: 'Reorder Policies', href: `/${orgSlug}/planning/reorder-policies` },
      ],
    },
    {
      name: 'Quality',
      icon: ClipboardCheck,
      featureKey: 'quality',
      children: [
        { name: 'Inspections', href: `/${orgSlug}/quality/inspections` },
        { name: 'Quality Holds', href: `/${orgSlug}/quality/holds` },
        { name: 'NCRs', href: `/${orgSlug}/quality/ncr` },
        { name: 'CAPAs', href: `/${orgSlug}/quality/capa` },
      ],
    },
    {
      name: 'Tax & Localization',
      icon: MapPin,
      featureKey: 'tax-localization',
      children: [
        { name: 'Tax Jurisdictions', href: `/${orgSlug}/tax/jurisdictions` },
        { name: 'Tax Rules', href: `/${orgSlug}/tax/rules` },
        { name: 'Tax Exemptions', href: `/${orgSlug}/tax/exemptions` },
        { name: 'Localization Settings', href: `/${orgSlug}/tax/localization` },
        { name: 'E-Invoicing', href: `/${orgSlug}/tax/e-invoicing` },
      ],
    },
    {
      name: 'Onboarding',
      icon: BookOpen,
      href: '/onboarding',
      featureKey: 'dashboard',
    },
    {
      name: 'Settings',
      icon: Settings,
      featureKey: 'settings',
      children: [
        { name: 'General', href: `/${orgSlug}/settings` },
        { name: 'Branches', href: `/${orgSlug}/settings/branches` },
        { name: 'Integrations', href: `/${orgSlug}/settings/integrations` },
        { name: 'Users & Roles', href: `/${orgSlug}/settings/users` },
      ],
    },
  ];

  // Filter navigation based on package tier
  const filteredNavigation = navigation.filter((item) => 
    hasFeature(orgPackage, item.featureKey)
  );

  // Get missing features for upgrade prompt
  const missingFeatures = navigation.filter((item) => 
    !hasFeature(orgPackage, item.featureKey)
  );
  
  const showUpgradePrompt = missingFeatures.length > 0;

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-slate-900 border-r border-slate-700 transform transition-transform duration-200 ease-in-out flex flex-col overflow-visible ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700">
          <Link href={`/${orgSlug}/dashboard`} className="text-xl font-bold text-blue-400">
            YourBooks
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Organization */}
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {organization?.name}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${getTierBadgeColor(orgPackage)}`}>
              {getTierDisplayName(orgPackage)}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          {filteredNavigation.map((item) => {
            const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
              // Clear any pending close timeout
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              
              setHoveredCategory(item.name);
              const rect = e.currentTarget.getBoundingClientRect();
              setFlyoutPosition({
                top: rect.top,
                left: rect.right + 8 // 8px gap between sidebar and flyout
              });
            };

            const handleMouseLeave = () => {
              // Delay closing to allow mouse to reach flyout
              closeTimeoutRef.current = setTimeout(() => {
                setHoveredCategory(null);
              }, 150);
            };

            return (
              <div
                key={item.name}
                ref={(el) => { categoryRefs.current[item.name] = el; }}
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {item.children ? (
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 cursor-pointer group">
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3 text-slate-400" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-400" />
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      pathname === item.href
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
          {showUpgradePrompt && (
            <div className="mt-4 rounded-md border border-blue-900 bg-gradient-to-br from-blue-950 to-purple-950 p-3 text-xs">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-white">Unlock More Features</span>
              </div>
              <p className="text-blue-200 mb-2">
                Upgrade to access {missingFeatures.length} more feature{missingFeatures.length > 1 ? 's' : ''} including:
              </p>
              <ul className="text-blue-300 space-y-1 mb-3">
                {missingFeatures.slice(0, 3).map((feature) => (
                  <li key={feature.name} className="flex items-center gap-1">
                    <span className="text-yellow-400">•</span> {feature.name}
                  </li>
                ))}
                {missingFeatures.length > 3 && (
                  <li className="text-blue-400">and {missingFeatures.length - 3} more...</li>
                )}
              </ul>
              <div className="flex gap-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-blue-600 hover:to-purple-700 shadow-lg"
                >
                  View Plans
                </Link>
                <Link
                  href={`/${orgSlug}/settings/billing`}
                  className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold text-blue-300 hover:text-blue-100"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Logout Button - Fixed at Bottom */}
        <div className="mt-auto border-t border-slate-700 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-md transition"
          >
            <LogOut className="h-5 w-5 mr-3 text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Flyout Menu Portal */}
      {hoveredCategory && flyoutPosition && (() => {
        const item = filteredNavigation.find(nav => nav.name === hoveredCategory);
        if (!item?.children) return null;
        
        const handleFlyoutMouseEnter = () => {
          // Clear any pending close timeout when mouse enters flyout
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
        };

        const handleFlyoutMouseLeave = () => {
          // Close immediately when leaving flyout
          setHoveredCategory(null);
        };
        
        return (
          <div
            className="fixed w-64 rounded-lg border border-gray-200 bg-white shadow-xl z-[100] animate-in fade-in slide-in-from-left-2 duration-150"
            style={{ 
              top: `${flyoutPosition.top}px`, 
              left: `${flyoutPosition.left}px` 
            }}
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
          >
            <div className="p-2">
              <div className="px-2 py-2 text-xs font-semibold text-gray-500">{item.name}</div>
              {item.children.map((child) => (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`block px-3 py-2 text-sm rounded-md transition ${
                    pathname === child.href
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Main Content */}
      <div className={`transition-all duration-200 bg-gray-50 min-h-screen ${
        sidebarOpen ? 'lg:pl-56' : ''
      }`}>
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shadow-sm relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-300 hover:text-white lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-6 w-full justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-white hidden md:inline-block">{organization?.name}</span>
              {/* Global Search Bar */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 100)}
                  placeholder="Search customers, invoices, accounts... (/)"
                  className="w-64 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                />
                {searchOpen && search && (
                  <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg p-2 z-50">
                    <div className="text-sm text-gray-600">Search results for "{search}"</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Switcher */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="text-slate-300 hover:text-white"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* Notifications */}
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="text-slate-300 hover:text-white relative"
                aria-label="Notifications"
              >
                <span className="text-xl">🔔</span>
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                </button>
                
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <div className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</div>
                      <div className="text-sm text-gray-600">{user?.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="lg:ml-56 min-h-[calc(100vh-4rem)] p-6 max-w-[1600px] mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 lg:hidden z-40 flex justify-around py-2">
          <Link href={`/${orgSlug}/dashboard`} className="flex flex-col items-center text-slate-300 hover:text-white">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </Link>
          <Link href={`/${orgSlug}/accounts-receivable/invoices`} className="flex flex-col items-center text-slate-300 hover:text-white">
            <FileText className="w-5 h-5" />
            <span className="text-xs mt-1">Invoices</span>
          </Link>
          <Link href={`/${orgSlug}/accounts-payable/bills`} className="flex flex-col items-center text-slate-300 hover:text-white">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs mt-1">Bills</span>
          </Link>
          <button onClick={() => setSearchOpen(true)} className="flex flex-col items-center text-slate-300 hover:text-white">
            <span className="text-xl">🔍</span>
            <span className="text-xs mt-1">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
