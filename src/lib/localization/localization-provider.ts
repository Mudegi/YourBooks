/**
 * Localization Provider Service
 * Implements strategy pattern for country-specific localization drivers
 * Supports "Global by Design but Localized by Configuration" architecture
 */

import prisma from '@/lib/prisma';
import { SUPPORTED_COUNTRIES } from '../tax/compliance-pack-selector';

export interface LocalizationContext {
  organizationId: string;
  country: string;
  language?: string;
}

export interface LocalizationMetadata {
  apiEndpoints: {
    taxAuthority: string;
    eInvoicing: string;
    taxReturns: string;
    compliance: string;
  };
  taxReturnTemplates: {
    vat: string;
    wht: string;
    paye: string;
    cit: string;
  };
  digitalFiscalization: {
    eInvoicing: boolean;
    qrCodes: boolean;
    digitalSignatures: boolean;
    realTimeReporting: boolean;
  };
  translationKeys: Record<string, string>;
  complianceDrivers: Record<string, any>;
  fiscalCalendar: {
    taxYearStart: string;
    taxPeriods: string[];
    filingDeadlines: Record<string, string>;
  };
  regulatoryBodies: {
    name: string;
    contact: string;
    website: string;
    requirements: string[];
  }[];
}

// Strategy interface for country-specific localization
export interface LocalizationStrategy {
  countryCode: string;

  // Get localization metadata for the country
  getLocalizationMetadata(): Promise<LocalizationMetadata>;

  // Get tax authority API endpoints
  getTaxAuthorityEndpoints(): Promise<{
    baseUrl: string;
    endpoints: Record<string, string>;
    authentication: {
      type: string;
      credentials: string[];
    };
  }>;

  // Get tax return templates and requirements
  getTaxReturnTemplates(): Promise<{
    templates: Record<string, any>;
    validationRules: Record<string, any>;
    filingRequirements: Record<string, any>;
  }>;

  // Get digital fiscalization requirements
  getDigitalFiscalizationConfig(): Promise<{
    eInvoicing: {
      required: boolean;
      format: string;
      provider: string;
      metadata: any;
    };
    qrCodes: {
      required: boolean;
      format: string;
      data: string[];
    };
    digitalSignatures: {
      required: boolean;
      provider: string;
      certificate: string;
    };
  }>;

  // Get translation keys for tax labels
  getTranslationKeys(language: string): Promise<Record<string, string>>;

  // Validate localization configuration
  validateConfiguration(config: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

// Registry for localization strategies
class LocalizationStrategyRegistry {
  private strategies: Map<string, LocalizationStrategy> = new Map();

  register(strategy: LocalizationStrategy) {
    this.strategies.set(strategy.countryCode, strategy);
  }

  get(countryCode: string): LocalizationStrategy | null {
    return this.strategies.get(countryCode) || null;
  }

  getAll(): LocalizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  getSupportedCountries(): string[] {
    return Array.from(this.strategies.keys());
  }
}

const strategyRegistry = new LocalizationStrategyRegistry();

// Base localization strategy class
export abstract class BaseLocalizationStrategy implements LocalizationStrategy {
  abstract countryCode: string;

  async getLocalizationMetadata(): Promise<LocalizationMetadata> {
    // Default implementation - should be overridden by country-specific strategies
    return {
      apiEndpoints: {
        taxAuthority: '',
        eInvoicing: '',
        taxReturns: '',
        compliance: '',
      },
      taxReturnTemplates: {
        vat: '',
        wht: '',
        paye: '',
        cit: '',
      },
      digitalFiscalization: {
        eInvoicing: false,
        qrCodes: false,
        digitalSignatures: false,
        realTimeReporting: false,
      },
      translationKeys: {},
      complianceDrivers: {},
      fiscalCalendar: {
        taxYearStart: '01-01',
        taxPeriods: ['monthly', 'quarterly', 'annually'],
        filingDeadlines: {},
      },
      regulatoryBodies: [],
    };
  }

  async getTaxAuthorityEndpoints(): Promise<{
    baseUrl: string;
    endpoints: Record<string, string>;
    authentication: { type: string; credentials: string[] };
  }> {
    throw new Error(`Tax authority endpoints not implemented for ${this.countryCode}`);
  }

  async getTaxReturnTemplates(): Promise<{
    templates: Record<string, any>;
    validationRules: Record<string, any>;
    filingRequirements: Record<string, any>;
  }> {
    throw new Error(`Tax return templates not implemented for ${this.countryCode}`);
  }

  async getDigitalFiscalizationConfig(): Promise<{
    eInvoicing: { required: boolean; format: string; provider: string; metadata: any };
    qrCodes: { required: boolean; format: string; data: string[] };
    digitalSignatures: { required: boolean; provider: string; certificate: string };
  }> {
    return {
      eInvoicing: {
        required: false,
        format: '',
        provider: '',
        metadata: {},
      },
      qrCodes: {
        required: false,
        format: '',
        data: [],
      },
      digitalSignatures: {
        required: false,
        provider: '',
        certificate: '',
      },
    };
  }

  async getTranslationKeys(language: string): Promise<Record<string, string>> {
    // Default English translations
    return {
      'tax.vat': 'VAT',
      'tax.wht': 'Withholding Tax',
      'tax.paye': 'PAYE',
      'tax.cit': 'Corporate Income Tax',
      'invoice.number': 'Invoice Number',
      'invoice.date': 'Invoice Date',
      'invoice.amount': 'Amount',
      'invoice.tax': 'Tax',
      'invoice.total': 'Total',
    };
  }

  async validateConfiguration(config: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
}

// Main Localization Provider Service
export class LocalizationProvider {
  private static instance: LocalizationProvider;
  private currentStrategy: LocalizationStrategy | null = null;

  private constructor() {}

  static getInstance(): LocalizationProvider {
    if (!LocalizationProvider.instance) {
      LocalizationProvider.instance = new LocalizationProvider();
    }
    return LocalizationProvider.instance;
  }

  // Register a localization strategy
  registerStrategy(strategy: LocalizationStrategy) {
    strategyRegistry.register(strategy);
  }

  // Set the current localization strategy based on country
  async setLocalizationStrategy(context: LocalizationContext): Promise<void> {
    const strategy = strategyRegistry.get(context.country);
    if (!strategy) {
      throw new Error(`Localization strategy not found for country: ${context.country}`);
    }
    this.currentStrategy = strategy;
  }

  // Get current localization strategy
  getCurrentStrategy(): LocalizationStrategy | null {
    return this.currentStrategy;
  }

  // Get localization metadata for current strategy
  async getLocalizationMetadata(): Promise<LocalizationMetadata> {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getLocalizationMetadata();
  }

  // Get tax authority endpoints
  async getTaxAuthorityEndpoints() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getTaxAuthorityEndpoints();
  }

  // Get tax return templates
  async getTaxReturnTemplates() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getTaxReturnTemplates();
  }

  // Get digital fiscalization config
  async getDigitalFiscalizationConfig() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getDigitalFiscalizationConfig();
  }

  // Get translation keys
  async getTranslationKeys(language: string = 'en'): Promise<Record<string, string>> {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getTranslationKeys(language);
  }

  // Validate configuration
  async validateConfiguration(config: any) {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.validateConfiguration(config);
  }

  // Get supported countries
  getSupportedCountries(): string[] {
    return strategyRegistry.getSupportedCountries();
  }

  // Initialize localization for an organization
  async initializeOrganizationLocalization(organizationId: string): Promise<void> {
    // Get organization's localization config
    const localizationConfig = await prisma.localizationConfig.findUnique({
      where: { organizationId },
    });

    if (!localizationConfig) {
      throw new Error(`Localization config not found for organization: ${organizationId}`);
    }

    // Set the localization strategy
    await this.setLocalizationStrategy({
      organizationId,
      country: localizationConfig.country,
      language: localizationConfig.language,
    });
  }

  // Update localization configuration
  async updateLocalizationConfig(
    organizationId: string,
    updates: Partial<{
      country: string;
      language: string;
      apiEndpoints: any;
      taxReturnTemplates: any;
      digitalFiscalization: any;
      translationKeys: any;
      complianceDrivers: any;
      fiscalCalendar: any;
      regulatoryBodies: any;
    }>
  ): Promise<void> {
    // Update the database
    await prisma.localizationConfig.update({
      where: { organizationId },
      data: updates,
    });

    // If country changed, update the strategy
    if (updates.country) {
      await this.setLocalizationStrategy({
        organizationId,
        country: updates.country,
        language: updates.language,
      });
    }
  }
}

// Export singleton instance
export const localizationProvider = LocalizationProvider.getInstance();