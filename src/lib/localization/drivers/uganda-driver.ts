/**
 * Uganda Localization Driver
 * Implements Uganda-specific localization requirements for URA compliance
 */

import { BaseLocalizationStrategy, LocalizationMetadata } from './localization-provider';

export class UgandaLocalizationStrategy extends BaseLocalizationStrategy {
  countryCode = 'UG';

  async getLocalizationMetadata(): Promise<LocalizationMetadata> {
    return {
      apiEndpoints: {
        taxAuthority: 'https://ursb.go.ug',
        eInvoicing: 'https://efris.ursb.go.ug',
        taxReturns: 'https://ursb.go.ug/tax-returns',
        compliance: 'https://ursb.go.ug/compliance',
      },
      taxReturnTemplates: {
        vat: 'URA_VAT_RETURN_V1',
        wht: 'URA_WHT_RETURN_V1',
        paye: 'URA_PAYE_RETURN_V1',
        cit: 'URA_CIT_RETURN_V1',
      },
      digitalFiscalization: {
        eInvoicing: true,
        qrCodes: true,
        digitalSignatures: true,
        realTimeReporting: true,
      },
      translationKeys: {},
      complianceDrivers: {
        efrisIntegration: true,
        realTimeInvoicing: true,
        qrCodeGeneration: true,
        digitalSignatures: true,
      },
      fiscalCalendar: {
        taxYearStart: '07-01', // July 1st (Uganda tax year)
        taxPeriods: ['monthly', 'quarterly', 'annually'],
        filingDeadlines: {
          vat: '15th of following month',
          wht: '15th of following month',
          paye: '15th of following month',
          cit: '31st March following year end',
        },
      },
      regulatoryBodies: [
        {
          name: 'Uganda Revenue Authority (URA)',
          contact: '+256 414 301 000',
          website: 'https://ursb.go.ug',
          requirements: [
            'EFRIS e-Invoicing mandatory',
            'Digital signatures required',
            'QR codes on all invoices',
            'Real-time tax reporting',
          ],
        },
      ],
    };
  }

  async getTaxAuthorityEndpoints() {
    return {
      baseUrl: 'https://efris.ursb.go.ug',
      endpoints: {
        authenticate: '/api/v1/authenticate',
        submitInvoice: '/api/v1/invoices',
        queryInvoice: '/api/v1/invoices/query',
        submitStock: '/api/v1/stock',
        submitTaxReturn: '/api/v1/returns',
        getTaxpayerInfo: '/api/v1/taxpayer',
      },
      authentication: {
        type: 'bearer_token',
        credentials: ['username', 'password', 'private_key'],
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
            'taxpayerTin',
            'taxPeriod',
            'totalSales',
            'taxableSales',
            'vatCollected',
            'totalPurchases',
            'taxablePurchases',
            'inputVat',
            'vatPayable',
          ],
          validationRules: {
            totalSales: { required: true, min: 0 },
            vatCollected: { required: true, min: 0 },
            inputVat: { required: true, min: 0 },
          },
        },
        wht: {
          formNumber: 'WHT 102',
          fields: [
            'taxpayerName',
            'taxpayerTin',
            'taxPeriod',
            'paymentsMade',
            'whtDeducted',
            'whtRemitted',
          ],
          validationRules: {
            paymentsMade: { required: true, min: 0 },
            whtDeducted: { required: true, min: 0 },
          },
        },
      },
      validationRules: {
        tin: { pattern: '^[A-Z0-9]{10}$', required: true },
        amount: { min: 0, max: 999999999.99 },
        date: { format: 'YYYY-MM-DD' },
      },
      filingRequirements: {
        vat: {
          frequency: 'monthly',
          deadline: '15th of following month',
          electronic: true,
        },
        wht: {
          frequency: 'monthly',
          deadline: '15th of following month',
          electronic: true,
        },
      },
    };
  }

  async getDigitalFiscalizationConfig() {
    return {
      eInvoicing: {
        required: true,
        format: 'EFRIS_JSON',
        provider: 'URA_EFRIS',
        metadata: {
          version: '1.0',
          requiresRealTime: true,
          qrCodeRequired: true,
          digitalSignatureRequired: true,
        },
      },
      qrCodes: {
        required: true,
        format: 'EFRIS_QR',
        data: [
          'invoiceNumber',
          'date',
          'amount',
          'taxAmount',
          'buyerTin',
          'sellerTin',
          'verificationUrl',
        ],
      },
      digitalSignatures: {
        required: true,
        provider: 'URA_CERTIFICATE',
        certificate: 'Class 3 Digital Signature Certificate',
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
        'invoice.amount': 'Amount (UGX)',
        'invoice.tax': 'Tax Amount',
        'invoice.total': 'Total Amount',
        'ura.tin': 'URA TIN',
        'efris.fdn': 'EFRIS FDN',
        'efris.qr': 'EFRIS QR Code',
        'compliance.status': 'Compliance Status',
      },
      // Add other languages as needed
    };

    return translations[language] || translations.en;
  }

  async validateConfiguration(config: any) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate URA TIN format
    if (config.uraTin && !/^[A-Z0-9]{10}$/.test(config.uraTin)) {
      errors.push('Invalid URA TIN format. Must be 10 alphanumeric characters.');
    }

    // Validate EFRIS configuration
    if (config.efrisEnabled) {
      if (!config.efrisUsername) {
        errors.push('EFRIS username is required when EFRIS is enabled.');
      }
      if (!config.efrisPassword) {
        errors.push('EFRIS password is required when EFRIS is enabled.');
      }
      if (!config.privateKeyPath) {
        warnings.push('Private key path not configured. Digital signatures may not work.');
      }
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