'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CountryOption {
  code: string;
  name: string;
  currency: string;
  compliancePack: string;
  fullyImplemented: boolean;
  recommended: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    organizationName: '',
    organizationSlug: '',
    homeCountry: '',
    legalName: '',
    taxIdNumber: '',
    tradingLicense: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch('/api/onboarding/countries');
        if (!res.ok) throw new Error('Failed to load countries');
        const json = await res.json();
        setCountries(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Onboarding failed');
      }

      const json = await res.json();
      const slug = json.data?.organization?.slug;
      if (slug) {
        router.push(`/${slug}/dashboard`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading onboarding...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Set up your organization</h1>
          <p className="text-gray-600">Create an organization, choose country, and initialize compliance.</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                name="organizationName"
                value={form.organizationName}
                onChange={onChange}
                required
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Slug</label>
              <input
                name="organizationSlug"
                value={form.organizationSlug}
                onChange={onChange}
                required
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Legal Name</label>
              <input
                name="legalName"
                value={form.legalName}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID</label>
              <input
                name="taxIdNumber"
                value={form.taxIdNumber}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trading License</label>
              <input
                name="tradingLicense"
                value={form.tradingLicense}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Home Country</label>
              <select
                name="homeCountry"
                value={form.homeCountry}
                onChange={onChange}
                required
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.currency}) {c.recommended ? '• Recommended' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Setting up...' : 'Create organization'}
            </button>
            <span className="text-sm text-gray-600">Compliance pack will auto-initialize for supported countries.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
