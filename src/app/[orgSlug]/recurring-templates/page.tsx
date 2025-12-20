import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function getTemplates(orgSlug: string, searchParams: URLSearchParams) {
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) return [];
  const status = searchParams.get('status') as any;
  const type = searchParams.get('type') as any;
  const approval = searchParams.get('approval');

  return prisma.recurringTemplate.findMany({
    where: {
      organizationId: org.id,
      ...(status ? { status } : {}),
      ...(type ? { templateType: type } : {}),
      ...(approval ? { approvalRequired: approval === 'true' } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export default async function Page({ params, searchParams }: { params: { orgSlug: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const sp = new URLSearchParams(Object.entries(searchParams).flatMap(([k, v]) => {
    if (Array.isArray(v)) return v.map((vv) => [k, vv]);
    return v ? [[k, v]] : [];
  }));
  const templates = await getTemplates(params.orgSlug, sp);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recurring Templates</h1>
        <Link href={`/${params.orgSlug}/recurring-templates/new`} className="text-blue-600 hover:underline">New Template</Link>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select name="status" defaultValue={sp.get('status') ?? ''} className="mt-1 w-full border rounded p-2">
            <option value="">All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select name="type" defaultValue={sp.get('type') ?? ''} className="mt-1 w-full border rounded p-2">
            <option value="">All</option>
            <option value="JOURNAL_ENTRY">Journal</option>
            <option value="INVOICE">Invoice</option>
            <option value="BILL">Bill</option>
            <option value="PAYMENT">Payment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Approval Required</label>
          <select name="approval" defaultValue={sp.get('approval') ?? ''} className="mt-1 w-full border rounded p-2">
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="border rounded px-4 py-2">Apply</button>
          <Link href={`/${params.orgSlug}/recurring-templates`} className="border rounded px-4 py-2">Reset</Link>
        </div>
      </form>

      <Suspense>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Next Run</th>
                <th className="p-2 text-left">Approval</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.name}</td>
                  <td className="p-2">{t.templateType}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2">{t.nextRunAt ? new Date(t.nextRunAt).toLocaleString() : '-'}</td>
                  <td className="p-2">{t.approvalRequired ? 'Yes' : 'No'}</td>
                  <td className="p-2 space-x-2">
                    <Link href={`/${params.orgSlug}/recurring-templates/${t.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                    <Link href={`/${params.orgSlug}/recurring-executions?templateId=${t.id}`} className="text-blue-600 hover:underline">Executions</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Suspense>
    </div>
  );
}
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RecurringTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      const res = await fetch(`/api/${orgSlug}/recurring-templates`);
      const json = await res.json();
      if (json.success) setTemplates(json.data);
      setLoading(false);
    }
    if (orgSlug) fetchTemplates();
  }, [orgSlug]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Recurring Templates</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push(`/${orgSlug}/recurring-templates/new`)}
        >
          New Template
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-gray-600">No templates yet. Create one to get started.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left border">Name</th>
                <th className="px-3 py-2 text-left border">Type</th>
                <th className="px-3 py-2 text-left border">Frequency</th>
                <th className="px-3 py-2 text-left border">Status</th>
                <th className="px-3 py-2 text-left border">Next Run</th>
                <th className="px-3 py-2 text-left border">Executed</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/${orgSlug}/recurring-templates/${t.id}`)}>
                  <td className="px-3 py-2 border">{t.name}</td>
                  <td className="px-3 py-2 border">{t.templateType}</td>
                  <td className="px-3 py-2 border">{t.frequency}</td>
                  <td className="px-3 py-2 border">{t.status}</td>
                  <td className="px-3 py-2 border">{t.nextRunAt ? new Date(t.nextRunAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 border">{t.executedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
