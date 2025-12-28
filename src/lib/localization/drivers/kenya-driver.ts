/**
 * Kenya Localization Driver
 * Implements Kenya-specific localization requirements for KRA compliance
 */

import { BaseLocalizationStrategy, LocalizationMetadata } from '../localization-provider';

export class KenyaLocalizationStrategy extends BaseLocalizationStrategy {
  countryCode = 'KE';

  async getLocalizationMetadata(): Promise<LocalizationMetadata> {
    return {
      apiEndpoints: {
        taxAuthority: 'https://itax.kra.go.ke',
        eInvoicing: 'https://einvoice.kra.go.ke',
        taxReturns: 'https://itax.kra.go.ke/returns',
        compliance: 'https://kra.go.ke/compliance',
      },
      taxReturnTemplates: {
        vat: 'KRA_VAT_RETURN_V1',
        wht: 'KRA_WHT_RETURN_V1',
        paye: 'KRA_PAYE_RETURN_V1',
        cit: 'KRA_CIT_RETURN_V1',
      },
      digitalFiscalization: {
        eInvoicing: true,
        qrCodes: false,
        digitalSignatures: false,
        realTimeReporting: false,
      },
      translationKeys: {},
      complianceDrivers: {
        iTaxIntegration: true,
        electronicFiling: true,
        realTimeInvoicing: false,
      },
      fiscalCalendar: {
        taxYearStart: '01-01', // January 1st (Kenya tax year)
        taxPeriods: ['monthly', 'quarterly', 'annually'],
        filingDeadlines: {
          vat: '20th of following month',
          wht: '20th of following month',
          paye: '9th of following month',
          cit: '31st March following year end',
        },
      },
      regulatoryBodies: [
        {
          name: 'Kenya Revenue Authority (KRA)',
          contact: '+254 20 2729000',
          website: 'https://kra.go.ke',
          requirements: [
            'iTax electronic filing mandatory',
            'E-invoicing planned for implementation',
            'Digital tax compliance',
          ],
        },
      ],
    };
  }

  async getTaxAuthorityEndpoints() {
    return {
      baseUrl: 'https://itax.kra.go.ke',
      endpoints: {
        authenticate: '/api/authenticate',
        submitReturn: '/api/returns',
        queryReturn: '/api/returns/query',
        getTaxpayerInfo: '/api/taxpayer',
        submitPayment: '/api/payments',
      },
      authentication: {
        type: 'certificate',
        credentials: ['pin', 'certificate_path'],
      },
    };
  }

  async getTaxReturnTemplates() {
    return {
      templates: {
        vat: {
          formNumber: 'VAT 101',
          fields: [
            'taxpayerName',
            'kraPin',
            'taxPeriod',
            'totalSales',
            'vatableSales',
            'vatCollected',
            'totalPurchases',
            'vatablePurchases',
            'inputVat',
            'vatPayable',
          ],
          validationRules: {
            totalSales: { required: true, min: 0 },
            vatCollected: { required: true, min: 0 },
          },
        },
        paye: {
          formNumber: 'P9',
          fields: [
            'employeeName',
            'kraPin',
            'basicSalary',
            'benefits',
            'grossPay',
            'deductions',
            'taxablePay',
            'payeDeducted',
          ],
          validationRules: {
            basicSalary: { required: true, min: 0 },
            payeDeducted: { required: true, min: 0 },
          },
        },
      },
      validationRules: {
        kraPin: { pattern: '^[A-Z0-9]{11}$', required: true },
        amount: { min: 0, max: 999999999.99 },
        date: { format: 'YYYY-MM-DD' },
      },
      filingRequirements: {
        vat: {
          frequency: 'monthly',
          deadline: '20th of following month',
          electronic: true,
        },
        paye: {
          frequency: 'monthly',
          deadline: '9th of following month',
          electronic: true,
        },
      },
    };
  }

  async getDigitalFiscalizationConfig() {
    return {
      eInvoicing: {
        required: false, // Planned but not yet mandatory
        format: 'KRA_EINVOICE',
        provider: 'KRA_iTAX',
        metadata: {
          version: '1.0',
          plannedImplementation: '2024',
          currentlyOptional: true,
        },
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
    const translations: Record<string, Record<string, string>> = {
      en: {
        'tax.vat': 'Value Added Tax (VAT)',
        'tax.wht': 'Withholding Tax (WHT)',
        'tax.paye': 'Pay As You Earn (PAYE)',
        'tax.cit': 'Corporate Income Tax (CIT)',
        'invoice.number': 'Invoice Number',
        'invoice.date': 'Invoice Date',
        'invoice.amount': 'Amount (KES)',
        'invoice.tax': 'Tax Amount',
        'invoice.total': 'Total Amount',
        'kra.pin': 'KRA PIN',
        'compliance.status': 'Compliance Status',
      },
    };

    return translations[language] || translations.en;
  }

  async validateConfiguration(config: any) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate KRA PIN format
    if (config.kraPin && !/^[A-Z0-9]{11}$/.test(config.kraPin)) {
      errors.push('Invalid KRA PIN format. Must be 11 alphanumeric characters.');
    }

    // Validate tax period
    if (config.taxPeriod && !['monthly', 'quarterly', 'annually'].includes(config.taxPeriod)) {
      errors.push('Invalid tax period. Must be monthly, quarterly, or annually.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}