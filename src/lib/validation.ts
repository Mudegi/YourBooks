/**
 * Validation schemas using Zod
 */

import { z } from 'zod';
import { AccountType, UserRole, EntryType } from '@prisma/client';

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

// ============================================================================
// ORGANIZATION
// ============================================================================

export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  taxIdNumber: z.string().optional(),
  baseCurrency: z.string().length(3, 'Currency code must be 3 characters'),
  fiscalYearStart: z.number().min(1).max(12),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

export const chartOfAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  accountType: z.nativeEnum(AccountType),
  accountSubType: z.string().optional(),
  parentId: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  description: z.string().optional(),
});

// ============================================================================
// TRANSACTIONS & LEDGER ENTRIES
// ============================================================================

export const ledgerEntrySchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  entryType: z.nativeEnum(EntryType),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  description: z.string().optional(),
});

export const transactionSchema = z.object({
  transactionDate: z.coerce.date(),
  transactionType: z.string(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  entries: z
    .array(ledgerEntrySchema)
    .min(2, 'Transaction must have at least 2 entries'),
});

// ============================================================================
// CUSTOMERS & INVOICES
// ============================================================================

export const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxIdNumber: z.string().optional(),
  paymentTerms: z.number().int().min(0).default(30),
  creditLimit: z.number().positive().optional(),
  billingAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    })
    .optional(),
  shippingAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Price must be non-negative'),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

// ============================================================================
// VENDORS & BILLS
// ============================================================================

export const vendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxIdNumber: z.string().optional(),
  paymentTerms: z.number().int().min(0).default(30),
  bankAccount: z
    .object({
      accountName: z.string(),
      accountNumber: z.string(),
      bankName: z.string(),
      routingNumber: z.string().optional(),
    })
    .optional(),
  billingAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

export const billSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  vendorInvoiceNo: z.string().optional(),
  billDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

// ============================================================================
// PRODUCTS & INVENTORY
// ============================================================================

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  productType: z.enum(['INVENTORY', 'SERVICE', 'NON_INVENTORY']),
  category: z.string().optional(),
  unitOfMeasure: z.string().default('unit'),
  purchasePrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  trackInventory: z.boolean().default(true),
  reorderLevel: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  taxable: z.boolean().default(true),
  defaultTaxRate: z.number().min(0).max(100).default(0),
});

// ============================================================================
// MANUFACTURING & WAREHOUSE
// ============================================================================

export const bomLineSchema = z.object({
  componentId: z.string().min(1, 'Component is required'),
  quantityPer: z.number().positive('Quantity per unit must be positive'),
  scrapPercent: z.number().min(0).max(100).default(0),
  backflush: z.boolean().default(true),
  operationSeq: z.number().int().positive().optional(),
});

export const bomSchema = z.object({
  productId: z.string().min(1, 'Finished good is required'),
  name: z.string().min(1, 'BOM name is required'),
  version: z.string().default('1.0'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  isDefault: z.boolean().default(false),
  yieldPercent: z.number().min(0).max(150).default(100),
  scrapPercent: z.number().min(0).max(100).default(0),
  lines: z.array(bomLineSchema).min(1, 'At least one component is required'),
});

export const workOrderSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantityPlanned: z.number().positive('Planned quantity must be positive'),
  bomId: z.string().optional(),
  routingId: z.string().optional(),
  workCenterId: z.string().optional(),
  branchId: z.string().optional(),
  workOrderNumber: z.string().optional(),
  status: z.enum(['PLANNED', 'RELEASED', 'IN_PROGRESS', 'HOLD']).default('PLANNED'),
  dueDate: z.coerce.date().optional(),
  priority: z.number().int().min(1).max(5).default(3),
  notes: z.string().optional(),
});

// ============================================================================
// PAYMENTS
// ============================================================================

export const paymentSchema = z.object({
  paymentDate: z.coerce.date(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  paymentMethod: z.enum([
    'CASH',
    'CHECK',
    'BANK_TRANSFER',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'ONLINE_PAYMENT',
    'OTHER',
  ]),
  referenceNumber: z.string().optional(),
  bankAccountId: z.string().optional(),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
  notes: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type ChartOfAccountInput = z.infer<typeof chartOfAccountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type BillInput = z.infer<typeof billSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type BomInput = z.infer<typeof bomSchema>;
export type WorkOrderInput = z.infer<typeof workOrderSchema>;
