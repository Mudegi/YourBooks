import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { PACKAGE_FEATURES, getTierDisplayName, getTierBadgeColor, type PackageTier } from '@/lib/package-features';

export default function PricingComparisonPage() {
  const tiers: PackageTier[] = ['PROFESSIONAL', 'ADVANCED'];

  const featureCategories = [
    {
      category: 'Core Features',
      features: [
        { name: 'Dashboard & Analytics', key: 'dashboard' },
        { name: 'General Ledger', key: 'general-ledger' },
        { name: 'Accounts Receivable', key: 'accounts-receivable' },
        { name: 'Accounts Payable', key: 'accounts-payable' },
        { name: 'Payments', key: 'payments' },
        { name: 'Banking', key: 'banking' },
        { name: 'Inventory Management', key: 'inventory' },
        { name: 'Financial Reports', key: 'reports' },
      ],
    },
    {
      category: 'Business Operations',
      features: [
        { name: 'Bank Feeds', key: 'bank-feeds' },
        { name: 'Document Management', key: 'documents' },
        { name: 'Project Tracking', key: 'projects' },
        { name: 'Multi-Currency', key: 'multi-currency' },
        { name: 'Budget Management', key: 'budget' },
        { name: 'Fixed Assets', key: 'fixed-assets' },
      ],
    },
    {
      category: 'Advanced Features (Advanced Only)',
      features: [
        { name: 'CRM', key: 'crm' },
        { name: 'Warehouse Management', key: 'warehouse' },
        { name: 'Manufacturing', key: 'manufacturing' },
        { name: 'HCM / Payroll', key: 'hcm' },
        { name: 'Field Service', key: 'field-service' },
        { name: 'Maintenance', key: 'maintenance' },
        { name: 'Advanced Reporting & BI', key: 'advanced-reporting' },
        { name: 'Workflows & Approvals', key: 'workflows' },
        { name: 'Integrations & API', key: 'integrations' },
        { name: 'Security & MDM', key: 'security-mdm' },
        { name: 'Advanced Inventory', key: 'inventory-advanced' },
        { name: 'Costing & Planning', key: 'costing' },
        { name: 'Planning & Forecasting', key: 'planning' },
        { name: 'Quality Management', key: 'quality' },
        { name: 'Tax & Localization', key: 'tax-localization' },
        { name: 'API Access', key: 'api-access' },
        { name: 'White Label', key: 'white-label' },
        { name: 'Custom Fields', key: 'custom-fields' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6 text-2xl font-bold text-blue-600">
            YourBooks
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scale your business with the right features. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {tiers.map((tier) => {
            const config = PACKAGE_FEATURES[tier];
            const isPopular = tier === 'PROFESSIONAL';

            return (
              <div
                key={tier}
                className={`relative rounded-2xl border-2 bg-white shadow-xl ${
                  isPopular
                    ? 'border-blue-500 ring-4 ring-blue-100'
                    : 'border-purple-500 ring-4 ring-purple-100'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-4 ${getTierBadgeColor(tier)}`}>
                    {getTierDisplayName(tier)}
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-4xl font-bold text-gray-900">
                      {tier === 'PROFESSIONAL' && '$79'}
                      {tier === 'ADVANCED' && 'Custom'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      per month
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>
                        {config.maxUsers ? `Up to ${config.maxUsers} users` : 'Unlimited users'}
                      </span>
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>
                        {config.maxOrganizations ? `${config.maxOrganizations} organization${config.maxOrganizations > 1 ? 's' : ''}` : 'Unlimited organizations'}
                      </span>
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="capitalize">{config.supportLevel} support</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{config.features.length} features</span>
                    </li>
                  </ul>

                  <Link
                    href="/register"
                    className={`block w-full text-center py-3 rounded-lg font-semibold transition-all ${
                      tier === 'PROFESSIONAL'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    }`}
                  >
                    {tier === 'ADVANCED' ? 'Contact Sales' : 'Get Started'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-2xl font-bold text-white text-center">
              Detailed Feature Comparison
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50">
                    Features
                  </th>
                  {tiers.map((tier) => (
                    <th
                      key={tier}
                      className={`p-4 font-semibold text-center ${getTierBadgeColor(tier)}`}
                    >
                      {getTierDisplayName(tier)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category) => (
                  <>
                    <tr key={category.category} className="bg-gray-50">
                      <td colSpan={5} className="p-4 font-bold text-gray-900">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 text-gray-700">{feature.name}</td>
                        {tiers.map((tier) => {
                          const hasFeature = PACKAGE_FEATURES[tier].features.includes(feature.key);
                          return (
                            <td key={tier} className="p-4 text-center">
                              {hasFeature ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses managing their finances with YourBooks
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg p-6 shadow">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Can I upgrade or downgrade my plan?
              </summary>
              <p className="mt-2 text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.
              </p>
            </details>
            <details className="bg-white rounded-lg p-6 shadow">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                What happens if I exceed my user limit?
              </summary>
              <p className="mt-2 text-gray-600">
                You'll be prompted to upgrade to the next tier. We'll notify you before any additional charges are applied.
              </p>
            </details>
            <details className="bg-white rounded-lg p-6 shadow">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Is there a free trial?
              </summary>
              <p className="mt-2 text-gray-600">
                Yes! All plans come with a 14-day free trial. No credit card required.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
