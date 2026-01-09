/**
 * Role-Based Access Control (RBAC) Utilities
 */

import { UserRole } from '@prisma/client';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  MANAGER: 2,
  ACCOUNTANT: 3,
  ADMIN: 4,
};

/**
 * Check if a role has at least the minimum required permission level
 */
export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user has permission to perform an action
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const rolePermissions = PERMISSIONS_BY_ROLE[userRole];
  return rolePermissions.includes(permission);
}

/**
 * Available permissions in the system
 */
export enum Permission {
  // Organization Management
  VIEW_ORGANIZATION = 'view:organization',
  MANAGE_ORGANIZATION = 'manage:organization',

  // General Ledger
  VIEW_CHART_OF_ACCOUNTS = 'view:chart_of_accounts',
  MANAGE_CHART_OF_ACCOUNTS = 'manage:chart_of_accounts',
  CREATE_JOURNAL_ENTRY = 'create:journal_entry',
  VOID_TRANSACTION = 'void:transaction',

  // Accounts Receivable
  VIEW_CUSTOMERS = 'view:customers',
  MANAGE_CUSTOMERS = 'manage:customers',
  VIEW_INVOICES = 'view:invoices',
  CREATE_INVOICE = 'create:invoice',
  EDIT_INVOICE = 'edit:invoice',
  VOID_INVOICE = 'void:invoice',

  // Accounts Payable
  VIEW_VENDORS = 'view:vendors',
  MANAGE_VENDORS = 'manage:vendors',
  VIEW_BILLS = 'view:bills',
  CREATE_BILL = 'create:bill',
  APPROVE_BILL = 'approve:bill',
  CREATE_PAYMENT = 'create:payment',

  // Banking
  VIEW_BANK_ACCOUNTS = 'view:bank_accounts',
  MANAGE_BANK_ACCOUNTS = 'manage:bank_accounts',
  RECONCILE_BANK = 'reconcile:bank',

  // Inventory
  VIEW_INVENTORY = 'view:inventory',
  MANAGE_INVENTORY = 'manage:inventory',
  ADJUST_INVENTORY = 'adjust:inventory',

  // Manufacturing & Warehouse
  VIEW_MANUFACTURING = 'view:manufacturing',
  MANAGE_MANUFACTURING = 'manage:manufacturing',
  VIEW_WAREHOUSE = 'view:warehouse',
  MANAGE_WAREHOUSE = 'manage:warehouse',

  // Fixed Assets
  VIEW_FIXED_ASSETS = 'view:fixed_assets',
  MANAGE_FIXED_ASSETS = 'manage:fixed_assets',

  // Reports
  VIEW_REPORTS = 'view:reports',
  EXPORT_REPORTS = 'export:reports',

  // Settings
  VIEW_SETTINGS = 'view:settings',
  MANAGE_SETTINGS = 'manage:settings',
  MANAGE_USERS = 'manage:users',

  // Audit
  VIEW_AUDIT_LOG = 'view:audit_log',

  // HCM / Payroll
  VIEW_EMPLOYEES = 'view:employees',
  MANAGE_EMPLOYEES = 'manage:employees',
  VIEW_PAYROLL = 'view:payroll',
  MANAGE_PAYROLL = 'manage:payroll',
  APPROVE_PAYROLL = 'approve:payroll',
  VIEW_LEAVE = 'view:leave',
  SUBMIT_LEAVE = 'submit:leave',
  APPROVE_LEAVE = 'approve:leave',
  VIEW_TIME_ENTRIES = 'view:time_entries',
  SUBMIT_TIME = 'submit:time',
  APPROVE_TIME = 'approve:time',
  VIEW_EXPENSES = 'view:expenses',
  SUBMIT_EXPENSES = 'submit:expenses',
  APPROVE_EXPENSES = 'approve:expenses',
  VIEW_PERFORMANCE = 'view:performance',
  MANAGE_PERFORMANCE = 'manage:performance',

  // Field Service
  VIEW_SERVICE_ORDERS = 'view:service_orders',
  MANAGE_SERVICE_ORDERS = 'manage:service_orders',
  VIEW_TECHNICIANS = 'view:technicians',
  MANAGE_TECHNICIANS = 'manage:technicians',

  // Maintenance / EAM
  VIEW_MAINTENANCE = 'view:maintenance',
  MANAGE_MAINTENANCE = 'manage:maintenance',
  VIEW_SPARE_PARTS = 'view:spare_parts',
  MANAGE_SPARE_PARTS = 'manage:spare_parts',

  // Reporting & BI
  VIEW_REPORTS_ADVANCED = 'view:reports_advanced',
  CREATE_REPORTS = 'create:reports',
  MANAGE_REPORTS = 'manage:reports',
  VIEW_DASHBOARDS = 'view:dashboards',
  CREATE_DASHBOARDS = 'create:dashboards',
  MANAGE_DASHBOARDS = 'manage:dashboards',
  SCHEDULE_REPORTS = 'schedule:reports',
  VIEW_DATA_CUBES = 'view:data_cubes',
  MANAGE_DATA_CUBES = 'manage:data_cubes',

  // Workflow & Approvals
  VIEW_WORKFLOWS = 'view:workflows',
  CREATE_WORKFLOWS = 'create:workflows',
  MANAGE_WORKFLOWS = 'manage:workflows',
  VIEW_APPROVALS = 'view:approvals',
  SUBMIT_FOR_APPROVAL = 'submit:approval',
  APPROVE_REQUESTS = 'approve:requests',
  DELEGATE_APPROVALS = 'delegate:approvals',

  // Integrations
  VIEW_INTEGRATIONS = 'view:integrations',
  MANAGE_INTEGRATIONS = 'manage:integrations',
  VIEW_WEBHOOKS = 'view:webhooks',
  MANAGE_WEBHOOKS = 'manage:webhooks',
  VIEW_EVENT_LOGS = 'view:event_logs',
  CONFIGURE_E_INVOICING = 'configure:e_invoicing',

  // Security & Controls
  VIEW_SECURITY_SETTINGS = 'view:security_settings',
  MANAGE_SECURITY_SETTINGS = 'manage:security_settings',
  VIEW_RLS_RULES = 'view:rls_rules',
  MANAGE_RLS_RULES = 'manage:rls_rules',
  VIEW_AUDIT_LOGS_ADVANCED = 'view:audit_logs_advanced',
  EXPORT_AUDIT_LOGS = 'export:audit_logs',
  CONFIGURE_SSO = 'configure:sso',
  MANAGE_MFA = 'manage:mfa',

  // Master Data Management
  VIEW_MDM = 'view:mdm',
  MANAGE_ITEM_MASTERS = 'manage:item_masters',
  APPROVE_MDM_CHANGES = 'approve:mdm_changes',
  VIEW_ATTRIBUTE_SETS = 'view:attribute_sets',
  MANAGE_ATTRIBUTE_SETS = 'manage:attribute_sets',
  VIEW_PRICE_LISTS = 'view:price_lists',
  MANAGE_PRICE_LISTS = 'manage:price_lists',
  VIEW_DISCOUNTS = 'view:discounts',
  MANAGE_DISCOUNTS = 'manage:discounts',
  VIEW_PROMOTIONS = 'view:promotions',
  MANAGE_PROMOTIONS = 'manage:promotions',

  // Inventory Advanced
  VIEW_CYCLE_COUNTS = 'view:cycle_counts',
  MANAGE_CYCLE_COUNTS = 'manage:cycle_counts',
  VIEW_INVENTORY_VALUATIONS = 'view:inventory_valuations',
  MANAGE_INVENTORY_VALUATIONS = 'manage:inventory_valuations',
  VIEW_STOCK_RESERVATIONS = 'view:stock_reservations',
  MANAGE_STOCK_RESERVATIONS = 'manage:stock_reservations',
  VIEW_LOT_TRACKING = 'view:lot_tracking',
  MANAGE_LOT_TRACKING = 'manage:lot_tracking',
  VIEW_SERIAL_TRACKING = 'view:serial_tracking',
  MANAGE_SERIAL_TRACKING = 'manage:serial_tracking',

  // Costing
  VIEW_STANDARD_COSTS = 'view:standard_costs',
  MANAGE_STANDARD_COSTS = 'manage:standard_costs',
  VIEW_COST_VARIANCES = 'view:cost_variances',
  MANAGE_COST_VARIANCES = 'manage:cost_variances',
  VIEW_LANDED_COSTS = 'view:landed_costs',
  MANAGE_LANDED_COSTS = 'manage:landed_costs',
  VIEW_COST_REVALUATIONS = 'view:cost_revaluations',
  MANAGE_COST_REVALUATIONS = 'manage:cost_revaluations',
  APPROVE_COST_REVALUATIONS = 'approve:cost_revaluations',

  // Services
  VIEW_SERVICES = 'view:services',
  CREATE_SERVICES = 'create:services',
  MANAGE_SERVICES = 'manage:services',
  VIEW_SERVICE_BOOKINGS = 'view:service_bookings',
  CREATE_SERVICE_BOOKINGS = 'create:service_bookings',
  MANAGE_SERVICE_BOOKINGS = 'manage:service_bookings',
  APPROVE_SERVICE_BOOKINGS = 'approve:service_bookings',
  VIEW_SERVICE_DELIVERIES = 'view:service_deliveries',
  CREATE_SERVICE_DELIVERIES = 'create:service_deliveries',
  MANAGE_SERVICE_DELIVERIES = 'manage:service_deliveries',
  LOG_SERVICE_TIME = 'log:service_time',
  VIEW_SERVICE_TIME = 'view:service_time',
  APPROVE_SERVICE_TIME = 'approve:service_time',

  // Planning
  VIEW_DEMAND_FORECASTS = 'view:demand_forecasts',
  MANAGE_DEMAND_FORECASTS = 'manage:demand_forecasts',
  VIEW_SAFETY_STOCK = 'view:safety_stock',
  MANAGE_SAFETY_STOCK = 'manage:safety_stock',
  VIEW_REORDER_POLICIES = 'view:reorder_policies',
  MANAGE_REORDER_POLICIES = 'manage:reorder_policies',
  VIEW_PRODUCT_PLANNING = 'view:product_planning',
  MANAGE_PRODUCT_PLANNING = 'manage:product_planning',

  // Quality
  VIEW_QUALITY_INSPECTIONS = 'view:quality_inspections',
  MANAGE_QUALITY_INSPECTIONS = 'manage:quality_inspections',
  APPROVE_QUALITY_INSPECTIONS = 'approve:quality_inspections',
  VIEW_QUALITY_HOLDS = 'view:quality_holds',
  MANAGE_QUALITY_HOLDS = 'manage:quality_holds',
  RELEASE_QUALITY_HOLDS = 'release:quality_holds',
  VIEW_COA = 'view:coa',
  ISSUE_COA = 'issue:coa',
  VIEW_NCR = 'view:ncr',
  MANAGE_NCR = 'manage:ncr',
  CLOSE_NCR = 'close:ncr',
  VIEW_CAPA = 'view:capa',
  MANAGE_CAPA = 'manage:capa',
  VERIFY_CAPA = 'verify:capa',
  CLOSE_CAPA = 'close:capa',

  // Tax & Localization
  VIEW_TAX_JURISDICTIONS = 'view:tax_jurisdictions',
  MANAGE_TAX_JURISDICTIONS = 'manage:tax_jurisdictions',
  VIEW_TAX_RULES = 'view:tax_rules',
  MANAGE_TAX_RULES = 'manage:tax_rules',
  VIEW_TAX_EXEMPTIONS = 'view:tax_exemptions',
  MANAGE_TAX_EXEMPTIONS = 'manage:tax_exemptions',
  VIEW_LOCALIZATION = 'view:localization',
  MANAGE_LOCALIZATION = 'manage:localization',
}

/**
 * Permissions by role
 */
const VIEWER_PERMISSIONS: Permission[] = [
  Permission.VIEW_CHART_OF_ACCOUNTS,
  Permission.VIEW_CUSTOMERS,
  Permission.VIEW_INVOICES,
  Permission.VIEW_VENDORS,
  Permission.VIEW_BILLS,
  Permission.VIEW_BANK_ACCOUNTS,
  Permission.VIEW_INVENTORY,
  Permission.VIEW_FIXED_ASSETS,
  Permission.VIEW_MANUFACTURING,
  Permission.VIEW_WAREHOUSE,
  Permission.VIEW_REPORTS,
  Permission.VIEW_SETTINGS,
  Permission.VIEW_EMPLOYEES,
  Permission.VIEW_LEAVE,
  Permission.VIEW_TIME_ENTRIES,
  Permission.VIEW_EXPENSES,
  Permission.SUBMIT_LEAVE,
  Permission.SUBMIT_TIME,
  Permission.SUBMIT_EXPENSES,
  Permission.VIEW_SERVICE_ORDERS,
  Permission.VIEW_MAINTENANCE,
  Permission.VIEW_REPORTS_ADVANCED,
  Permission.VIEW_DASHBOARDS,
  Permission.VIEW_APPROVALS,
  Permission.SUBMIT_FOR_APPROVAL,
  Permission.VIEW_INTEGRATIONS,
  Permission.VIEW_WEBHOOKS,
  Permission.VIEW_MDM,
  Permission.VIEW_ATTRIBUTE_SETS,
  Permission.VIEW_PRICE_LISTS,
  Permission.VIEW_DISCOUNTS,
  Permission.VIEW_PROMOTIONS,
  Permission.VIEW_CYCLE_COUNTS,
  Permission.VIEW_INVENTORY_VALUATIONS,
  Permission.VIEW_STOCK_RESERVATIONS,
  Permission.VIEW_LOT_TRACKING,
  Permission.VIEW_SERIAL_TRACKING,
  // Costing view
  Permission.VIEW_STANDARD_COSTS,
  Permission.VIEW_COST_VARIANCES,
  Permission.VIEW_LANDED_COSTS,
  Permission.VIEW_COST_REVALUATIONS,
  // Planning view
  Permission.VIEW_DEMAND_FORECASTS,
  Permission.VIEW_SAFETY_STOCK,
  Permission.VIEW_REORDER_POLICIES,
  Permission.VIEW_PRODUCT_PLANNING,
  // Quality view
  Permission.VIEW_QUALITY_INSPECTIONS,
  Permission.VIEW_QUALITY_HOLDS,
  Permission.VIEW_COA,
  Permission.VIEW_NCR,
  Permission.VIEW_CAPA,
  // Tax view
  Permission.VIEW_TAX_JURISDICTIONS,
  Permission.VIEW_TAX_RULES,
  Permission.VIEW_TAX_EXEMPTIONS,
  Permission.VIEW_LOCALIZATION,
  // Services view
  Permission.VIEW_SERVICES,
  Permission.VIEW_SERVICE_BOOKINGS,
  Permission.VIEW_SERVICE_DELIVERIES,
  Permission.VIEW_SERVICE_TIME,
];

const MANAGER_PERMISSIONS: Permission[] = [
  // All VIEWER permissions
  ...VIEWER_PERMISSIONS,
  // Plus additional permissions
  Permission.MANAGE_CUSTOMERS,
  Permission.CREATE_INVOICE,
  Permission.EDIT_INVOICE,
  Permission.MANAGE_VENDORS,
  Permission.CREATE_BILL,
  Permission.APPROVE_BILL,
  Permission.VIEW_MANUFACTURING,
  Permission.VIEW_WAREHOUSE,
  Permission.EXPORT_REPORTS,
  Permission.APPROVE_LEAVE,
  Permission.APPROVE_TIME,
  Permission.APPROVE_EXPENSES,
  Permission.VIEW_PERFORMANCE,
  Permission.MANAGE_SERVICE_ORDERS,
  Permission.VIEW_TECHNICIANS,
  Permission.CREATE_REPORTS,
  Permission.CREATE_DASHBOARDS,
  Permission.APPROVE_REQUESTS,
  Permission.DELEGATE_APPROVALS,
  Permission.VIEW_EVENT_LOGS,
  Permission.MANAGE_CYCLE_COUNTS,
  // Planning management
  Permission.MANAGE_DEMAND_FORECASTS,
  Permission.MANAGE_SAFETY_STOCK,
  Permission.MANAGE_REORDER_POLICIES,
  Permission.MANAGE_PRODUCT_PLANNING,
  // Quality management (basic)
  Permission.MANAGE_QUALITY_INSPECTIONS,
  Permission.MANAGE_QUALITY_HOLDS,
  Permission.MANAGE_NCR,
  Permission.MANAGE_CAPA,
  // Services management
  Permission.CREATE_SERVICES,
  Permission.MANAGE_SERVICES,
  Permission.CREATE_SERVICE_BOOKINGS,
  Permission.MANAGE_SERVICE_BOOKINGS,
  Permission.CREATE_SERVICE_DELIVERIES,
  Permission.MANAGE_SERVICE_DELIVERIES,
  Permission.LOG_SERVICE_TIME,
];

const ACCOUNTANT_PERMISSIONS: Permission[] = [
  // All MANAGER permissions
  ...MANAGER_PERMISSIONS,
  // Plus accounting-specific permissions
  Permission.MANAGE_CHART_OF_ACCOUNTS,
  Permission.CREATE_JOURNAL_ENTRY,
  Permission.VOID_TRANSACTION,
  Permission.VOID_INVOICE,
  Permission.CREATE_PAYMENT,
  Permission.MANAGE_BANK_ACCOUNTS,
  Permission.RECONCILE_BANK,
  Permission.MANAGE_INVENTORY,
  Permission.ADJUST_INVENTORY,
  Permission.MANAGE_FIXED_ASSETS,
    Permission.MANAGE_MANUFACTURING,
    Permission.MANAGE_WAREHOUSE,
    Permission.MANAGE_EMPLOYEES,
    Permission.VIEW_PAYROLL,
    Permission.MANAGE_PAYROLL,
    Permission.APPROVE_PAYROLL,
    Permission.MANAGE_PERFORMANCE,
    Permission.MANAGE_TECHNICIANS,
    Permission.VIEW_SPARE_PARTS,
    Permission.MANAGE_SPARE_PARTS,
    Permission.MANAGE_MAINTENANCE,
    Permission.MANAGE_REPORTS,
    Permission.MANAGE_DASHBOARDS,
    Permission.SCHEDULE_REPORTS,
    Permission.VIEW_DATA_CUBES,
    Permission.MANAGE_DATA_CUBES,
    Permission.VIEW_WORKFLOWS,
    Permission.CREATE_WORKFLOWS,
    Permission.VIEW_SECURITY_SETTINGS,
    Permission.VIEW_RLS_RULES,
    Permission.VIEW_AUDIT_LOGS_ADVANCED,
    Permission.MANAGE_ITEM_MASTERS,
    Permission.APPROVE_MDM_CHANGES,
    Permission.MANAGE_ATTRIBUTE_SETS,
    Permission.MANAGE_PRICE_LISTS,
    Permission.MANAGE_DISCOUNTS,
    Permission.MANAGE_PROMOTIONS,
    Permission.MANAGE_INVENTORY_VALUATIONS,
    Permission.MANAGE_STOCK_RESERVATIONS,
    Permission.MANAGE_LOT_TRACKING,
    Permission.MANAGE_SERIAL_TRACKING,
    // Costing management (full)
    Permission.MANAGE_STANDARD_COSTS,
    Permission.MANAGE_COST_VARIANCES,
    Permission.MANAGE_LANDED_COSTS,
    Permission.MANAGE_COST_REVALUATIONS,
    Permission.APPROVE_COST_REVALUATIONS,
    // Quality approvals
    Permission.APPROVE_QUALITY_INSPECTIONS,
    Permission.RELEASE_QUALITY_HOLDS,
    Permission.ISSUE_COA,
    Permission.CLOSE_NCR,
    Permission.VERIFY_CAPA,
    Permission.CLOSE_CAPA,
    // Tax management
    Permission.MANAGE_TAX_JURISDICTIONS,
    Permission.MANAGE_TAX_RULES,
    Permission.MANAGE_TAX_EXEMPTIONS,
    Permission.MANAGE_LOCALIZATION,
    // Service approvals
    Permission.APPROVE_SERVICE_BOOKINGS,
    Permission.APPROVE_SERVICE_TIME,
];

const ADMIN_PERMISSIONS: Permission[] = [
  // All permissions
  ...Object.values(Permission),
];

const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  VIEWER: VIEWER_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  ACCOUNTANT: ACCOUNTANT_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return PERMISSIONS_BY_ROLE[role];
}

/**
 * Check multiple permissions at once
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}
