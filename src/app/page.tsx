import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              YourBooks
            </h1>
            <p className="text-xl text-gray-600">
              Professional Multi-Tenant Accounting ERP
            </p>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome to Your Complete Accounting Solution
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 text-left mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">📊 General Ledger</h3>
                <p className="text-gray-600">Complete chart of accounts with double-entry bookkeeping</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">💰 Accounts Receivable</h3>
                <p className="text-gray-600">Invoice management and payment tracking</p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">💳 Accounts Payable</h3>
                <p className="text-gray-600">Bill processing and vendor management</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">🏦 Banking</h3>
                <p className="text-gray-600">Bank reconciliation and cash flow tracking</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">📦 Inventory</h3>
                <p className="text-gray-600">Perpetual inventory with COGS calculation</p>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">📈 Financial Reports</h3>
                <p className="text-gray-600">Real-time Balance Sheet, P&L, and more</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">🎯 Demo Credentials</h3>
            <div className="text-left space-y-2">
              <p><strong>Email:</strong> admin@example.com</p>
              <p><strong>Password:</strong> password123</p>
              <p><strong>Organization:</strong> demo-company</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-gray-600">
            <p className="mb-2">
              Built with Next.js, TypeScript, Prisma, PostgreSQL & Tailwind CSS
            </p>
            <p className="text-sm">
              Following double-entry bookkeeping principles with multi-tenant architecture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
