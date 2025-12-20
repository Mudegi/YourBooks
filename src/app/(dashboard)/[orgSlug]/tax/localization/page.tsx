'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe, Save, Loader2 } from 'lucide-react';

interface LocalizationConfig {
  id?: string;
  country: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currencyFormat: string;
  firstDayOfWeek: number;
  fiscalYearStart: number;
  taxIdLabel?: string;
  addressFormat?: any;
  reportingRequirements?: any;
}

const defaults: LocalizationConfig = {
  country: '',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  numberFormat: '1,234.56',
  currencyFormat: '$1,234.56',
  firstDayOfWeek: 0,
  fiscalYearStart: 1,
  taxIdLabel: 'Tax ID',
  addressFormat: null,
  reportingRequirements: null,
};

export default function LocalizationPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [config, setConfig] = useState<LocalizationConfig>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${orgSlug}/localization/config`);
      if (res.ok) {
        const json = await res.json();
        setConfig(json.data ? { ...defaults, ...json.data } : defaults);
      }
    } catch (err) {
      console.error('Failed to load localization config', err);
      setConfig(defaults);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const body = {
        ...config,
        firstDayOfWeek: Number(config.firstDayOfWeek),
        fiscalYearStart: Number(config.fiscalYearStart),
        addressFormat: parseJsonSafe(config.addressFormat),
        reportingRequirements: parseJsonSafe(config.reportingRequirements),
      };
      const res = await fetch(`/api/${orgSlug}/localization/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchConfig();
      }
    } catch (err) {
      console.error('Failed to save localization config', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Loading localization...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Localization Settings</h1>
          <p className="text-gray-500">Country packs for formats, tax labels, and statutory reporting</p>
        </div>
        <Button onClick={saveConfig} className="flex items-center gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-gray-700">Regional Formats</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Country</p>
              <Input value={config.country} onChange={(e) => setConfig({ ...config, country: e.target.value })} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Language</p>
              <Input value={config.language} onChange={(e) => setConfig({ ...config, language: e.target.value })} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Date Format</p>
              <Input value={config.dateFormat} onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Time Format</p>
              <Select value={config.timeFormat} onChange={(e) => setConfig({ ...config, timeFormat: e.target.value })}>
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </Select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Number Format</p>
              <Input value={config.numberFormat} onChange={(e) => setConfig({ ...config, numberFormat: e.target.value })} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Currency Format</p>
              <Input
                value={config.currencyFormat}
                onChange={(e) => setConfig({ ...config, currencyFormat: e.target.value })}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">First Day of Week (0=Sun,1=Mon)</p>
              <Input
                type="number"
                min={0}
                max={6}
                value={config.firstDayOfWeek}
                onChange={(e) => setConfig({ ...config, firstDayOfWeek: Number(e.target.value) })}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Fiscal Year Start (Month)</p>
              <Input
                type="number"
                min={1}
                max={12}
                value={config.fiscalYearStart}
                onChange={(e) => setConfig({ ...config, fiscalYearStart: Number(e.target.value) })}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tax ID Label</p>
              <Input value={config.taxIdLabel || ''} onChange={(e) => setConfig({ ...config, taxIdLabel: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <p className="text-sm text-gray-700 mb-2">Country Pack JSON</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Address Format (JSON)</p>
              <textarea
                className="w-full border rounded-lg p-2 text-sm min-h-[120px]"
                value={config.addressFormat ? JSON.stringify(config.addressFormat, null, 2) : ''}
                onChange={(e) => setConfig({ ...config, addressFormat: e.target.value })}
                placeholder='{ "lines": ["{street}", "{city}"] }'
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Reporting Requirements (JSON)</p>
              <textarea
                className="w-full border rounded-lg p-2 text-sm min-h-[120px]"
                value={config.reportingRequirements ? JSON.stringify(config.reportingRequirements, null, 2) : ''}
                onChange={(e) => setConfig({ ...config, reportingRequirements: e.target.value })}
                placeholder='{ "statutory": ["SAF-T", "VAT return"], "eInvoicing": true }'
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function parseJsonSafe(value: any) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('Invalid JSON payload, saving raw string');
    return value;
  }
}
