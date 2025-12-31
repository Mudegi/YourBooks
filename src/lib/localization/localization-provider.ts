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

  // NCR-specific localization methods
  getNCRRegulatoryRequirements(): Promise<{
    regulatoryBodies: {
      name: string;
      contact: string;
      website: string;
      requirements: string[];
    }[];
    standards: string[];
    reportingRequirements: {
      mandatory: boolean;
      frequency: string;
      format: string;
      authorities: string[];
    };
    complianceFields: string[];
  }>;

  getNCRValidationRules(): Promise<{
    severityLevels: string[];
    requiredFields: string[];
    customFields: {
      name: string;
      type: string;
      required: boolean;
      validation?: any;
    }[];
    workflowStates: string[];
    escalationRules: {
      condition: string;
      action: string;
      notify: string[];
    }[];
  }>;

  getNCRTranslationKeys(language: string): Promise<Record<string, string>>;

  validateNCRCompliance(ncrData: any): Promise<{
    isCompliant: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }>;

  // CAPA-specific localization methods
  getCAPARegulatoryRequirements(): Promise<{
    regulatoryBodies: {
      name: string;
      contact: string;
      website: string;
      requirements: string[];
    }[];
    standards: string[];
    reportingRequirements: {
      mandatory: boolean;
      frequency: string;
      format: string;
      authorities: string[];
    };
    complianceFields: string[];
  }>;

  getCAPAValidationRules(): Promise<{
    riskLevels: string[];
    investigationMethods: string[];
    requiredFields: string[];
    customFields: {
      name: string;
      type: string;
      required: boolean;
      validation?: any;
    }[];
    workflowStates: string[];
    escalationRules: {
      condition: string;
      action: string;
      notify: string[];
    }[];
  }>;

  getCAPATranslationKeys(language: string): Promise<Record<string, string>>;

  validateCAPACompliance(capaData: any): Promise<{
    isCompliant: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }>;

  getRiskAssessmentRules(): Promise<{
    riskMatrix: {
      likelihood: string[];
      impact: string[];
      riskLevels: Record<string, { min: number; max: number; actions: string[] }>;
    };
    assessmentCriteria: {
      financial: string[];
      operational: string[];
      compliance: string[];
      reputational: string[];
    };
    requiredEvidenceCodes: string[];
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

  // NCR-specific default implementations
  async getNCRRegulatoryRequirements(): Promise<{
    regulatoryBodies: {
      name: string;
      contact: string;
      website: string;
      requirements: string[];
    }[];
    standards: string[];
    reportingRequirements: {
      mandatory: boolean;
      frequency: string;
      format: string;
      authorities: string[];
    };
    complianceFields: string[];
  }> {
    return {
      regulatoryBodies: [],
      standards: ['ISO 9001'],
      reportingRequirements: {
        mandatory: false,
        frequency: 'as-needed',
        format: 'internal',
        authorities: [],
      },
      complianceFields: [],
    };
  }

  async getNCRValidationRules(): Promise<{
    severityLevels: string[];
    requiredFields: string[];
    customFields: {
      name: string;
      type: string;
      required: boolean;
      validation?: any;
    }[];
    workflowStates: string[];
    escalationRules: {
      condition: string;
      action: string;
      notify: string[];
    }[];
  }> {
    return {
      severityLevels: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      requiredFields: ['title', 'description', 'source', 'severity', 'status', 'detectedDate', 'detectedById'],
      customFields: [],
      workflowStates: ['OPEN', 'UNDER_INVESTIGATION', 'CONTAINED', 'CLOSED'],
      escalationRules: [],
    };
  }

  async getNCRTranslationKeys(language: string): Promise<Record<string, string>> {
    return {
      'ncr.title': 'Non-Conformance Report',
      'ncr.number': 'NCR Number',
      'ncr.description': 'Description',
      'ncr.severity': 'Severity',
      'ncr.status': 'Status',
      'ncr.source': 'Source',
      'ncr.rootCause': 'Root Cause',
      'ncr.containmentAction': 'Containment Action',
      'ncr.correctiveAction': 'Corrective Action',
      'ncr.preventiveAction': 'Preventive Action',
    };
  }

  async validateNCRCompliance(ncrData: any): Promise<{
    isCompliant: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Basic validation
    if (!ncrData.title) errors.push('NCR title is required');
    if (!ncrData.description) errors.push('NCR description is required');
    if (!ncrData.source) errors.push('NCR source is required');
    if (!ncrData.severity) errors.push('NCR severity is required');

    return {
      isCompliant: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  // CAPA-specific default implementations
  async getCAPARegulatoryRequirements(): Promise<{
    regulatoryBodies: {
      name: string;
      contact: string;
      website: string;
      requirements: string[];
    }[];
    standards: string[];
    reportingRequirements: {
      mandatory: boolean;
      frequency: string;
      format: string;
      authorities: string[];
    };
    complianceFields: string[];
  }> {
    return {
      regulatoryBodies: [],
      standards: ['ISO 9001'],
      reportingRequirements: {
        mandatory: false,
        frequency: 'as-needed',
        format: 'internal',
        authorities: [],
      },
      complianceFields: [],
    };
  }

  async getCAPAValidationRules(): Promise<{
    riskLevels: string[];
    investigationMethods: string[];
    requiredFields: string[];
    customFields: {
      name: string;
      type: string;
      required: boolean;
      validation?: any;
    }[];
    workflowStates: string[];
    escalationRules: {
      condition: string;
      action: string;
      notify: string[];
    }[];
  }> {
    return {
      riskLevels: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      investigationMethods: ['FISHBONE', '5_WHY', 'PARETO', 'FMEA', 'CUSTOM'],
      requiredFields: ['title', 'description', 'source', 'riskLevel', 'investigationMethod', 'status', 'createdDate', 'createdById'],
      customFields: [],
      workflowStates: ['OPEN', 'UNDER_INVESTIGATION', 'ACTIONS_PLANNED', 'ACTIONS_IMPLEMENTED', 'VERIFICATION_PENDING', 'CLOSED'],
      escalationRules: [],
    };
  }

  async getCAPATranslationKeys(language: string): Promise<Record<string, string>> {
    return {
      'capa.title': 'Corrective and Preventive Action',
      'capa.number': 'CAPA Number',
      'capa.description': 'Description',
      'capa.riskLevel': 'Risk Level',
      'capa.status': 'Status',
      'capa.source': 'Source',
      'capa.rootCause': 'Root Cause Analysis',
      'capa.correctiveAction': 'Corrective Action',
      'capa.preventiveAction': 'Preventive Action',
      'capa.effectivenessVerification': 'Effectiveness Verification',
    };
  }

  async validateCAPACompliance(capaData: any): Promise<{
    isCompliant: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Basic validation
    if (!capaData.title) errors.push('CAPA title is required');
    if (!capaData.description) errors.push('CAPA description is required');
    if (!capaData.source) errors.push('CAPA source is required');
    if (!capaData.riskLevel) errors.push('CAPA risk level is required');

    return {
      isCompliant: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  async getRiskAssessmentRules(): Promise<{
    riskMatrix: {
      likelihood: string[];
      impact: string[];
      riskLevels: Record<string, { min: number; max: number; actions: string[] }>;
    };
    assessmentCriteria: {
      financial: string[];
      operational: string[];
      compliance: string[];
      reputational: string[];
    };
    requiredEvidenceCodes: string[];
  }> {
    return {
      riskMatrix: {
        likelihood: ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN'],
        impact: ['INSIGNIFICANT', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'],
        riskLevels: {
          LOW: { min: 1, max: 6, actions: ['Monitor', 'Document'] },
          MEDIUM: { min: 7, max: 12, actions: ['Plan mitigation', 'Assign responsibility'] },
          HIGH: { min: 13, max: 20, actions: ['Immediate action required', 'Senior management review'] },
          CRITICAL: { min: 21, max: 25, actions: ['Emergency response', 'Board-level notification'] },
        },
      },
      assessmentCriteria: {
        financial: ['Cost impact', 'Revenue loss', 'Budget variance'],
        operational: ['Process disruption', 'Resource utilization', 'Timeline delay'],
        compliance: ['Regulatory violation', 'Contract breach', 'Standard non-compliance'],
        reputational: ['Customer satisfaction', 'Brand damage', 'Stakeholder trust'],
      },
      requiredEvidenceCodes: ['DOC', 'REC', 'OBS', 'INT', 'ANA'],
    };
  }
}

// Import and register all localization drivers
import './drivers/index';

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

  // NCR-specific methods
  async getNCRRegulatoryRequirements() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getNCRRegulatoryRequirements();
  }

  async getNCRValidationRules() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getNCRValidationRules();
  }

  async getNCRTranslationKeys(language: string = 'en'): Promise<Record<string, string>> {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getNCRTranslationKeys(language);
  }

  async validateNCRCompliance(ncrData: any) {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.validateNCRCompliance(ncrData);
  }

  // CAPA-specific methods
  async getCAPARegulatoryRequirements() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getCAPARegulatoryRequirements();
  }

  async getCAPAValidationRules() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getCAPAValidationRules();
  }

  async getCAPATranslationKeys(language: string = 'en'): Promise<Record<string, string>> {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getCAPATranslationKeys(language);
  }

  async validateCAPACompliance(capaData: any) {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.validateCAPACompliance(capaData);
  }

  async getRiskAssessmentRules() {
    if (!this.currentStrategy) {
      throw new Error('No localization strategy set');
    }
    return this.currentStrategy.getRiskAssessmentRules();
  }

  // Get supported countries
  getSupportedCountries(): string[] {
    return strategyRegistry.getSupportedCountries();
  }

  // Initialize localization for an organization
  async initializeOrganizationLocalization(organizationId: string): Promise<void> {
    try {
      // Get organization's localization config
      const localizationConfig = await prisma.localizationConfig.findUnique({
        where: { organizationId },
      });

      if (!localizationConfig) {
        // Create default localization config for the organization
        const defaultConfig = await prisma.localizationConfig.create({
          data: {
            organizationId,
            country: 'UG', // Default to Uganda
            language: 'en',
          },
        });

        // Set the localization strategy with default config
        await this.setLocalizationStrategy({
          organizationId,
          country: defaultConfig.country,
          language: defaultConfig.language,
        });
        return;
      }

      // Set the localization strategy
      await this.setLocalizationStrategy({
        organizationId,
        country: localizationConfig.country,
        language: localizationConfig.language,
      });
    } catch (error) {
      console.error('Error initializing organization localization:', error);
      // Fallback to default strategy
      await this.setLocalizationStrategy({
        organizationId,
        country: 'UG',
        language: 'en',
      });
    }
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