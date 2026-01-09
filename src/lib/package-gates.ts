/**
 * Package Gate Utilities
 * Centralized feature flags for Pro vs Advanced tiers
 */

// Type definitions for package tiers (mirrors Prisma enum)
export type PackageTier = 'PRO' | 'ADVANCED';

export const PACKAGE_FEATURES = {
  // YourBooks Pro - Essential accounting features
  PRO: {
    ledger: true,
    chartOfAccounts: true,
    invoicing: true,
    billing: true,
    payments: true,
    bankAccounts: true,
    basicBankFeeds: true,
    taxVatBasic: true,
    standardReports: true,
    userRoles: true,
    services: true,
    // Manufacturing services should be available for all packages
    manufacturing: true,
    // Not allowed
    fixedAssets: false,
    budgeting: false,
    projects: false,
    advancedReporting: false,
    compliance: false,
    automations: false,
    crm: false,
    advancedInventory: false,
    warehouse: false,
    hcm: false,
    fieldService: false,
    maintenance: false,
    quality: false,
    planning: false,
    costing: false,
  },

  // YourBooks Advanced - Full-featured ERP
  ADVANCED: {
    ledger: true,
    chartOfAccounts: true,
    invoicing: true,
    billing: true,
    payments: true,
    bankAccounts: true,
    basicBankFeeds: true,
    taxVatBasic: true,
    standardReports: true,
    userRoles: true,
    services: true,
    // Advanced features
    manufacturing: true,
    fixedAssets: true,
    budgeting: true,
    projects: true,
    advancedReporting: true,
    compliance: true,
    automations: true,
    crm: true,
    advancedInventory: true,
    warehouse: true,
    hcm: true,
    fieldService: true,
    maintenance: true,
    quality: true,
    planning: true,
    costing: true,
  },
};

export type FeatureKey = keyof typeof PACKAGE_FEATURES.ADVANCED;

/**
 * Check if a package has access to a feature
 */
export function hasFeatureAccess(
  packageTier: PackageTier,
  feature: FeatureKey
): boolean {
  // All features are now accessible regardless of package tier
  return true;
}

/**
 * Get list of allowed package tiers for a feature
 */
export function getPackagesForFeature(
  feature: FeatureKey
): PackageTier[] {
  const packages: PackageTier[] = [];
  if (PACKAGE_FEATURES.PRO[feature]) packages.push('PRO');
  if (PACKAGE_FEATURES.ADVANCED[feature]) packages.push('ADVANCED');
  return packages;
}

/**
 * Navigation item descriptor for gating
 */
export interface GatedNavItem {
  name: string;
  feature?: FeatureKey;
  children?: GatedNavItem[];
}

/**
 * Filter navigation items based on package tier
 */
export function filterNavigation(
  items: GatedNavItem[],
  packageTier: PackageTier
): GatedNavItem[] {
  return items.reduce((acc, item) => {
    // If no feature specified, always include
    if (!item.feature) {
      const filtered: GatedNavItem = {
        ...item,
        children: item.children
          ? filterNavigation(item.children, packageTier)
          : undefined,
      };
      acc.push(filtered);
      return acc;
    }

    // Check if user has access to feature
    if (hasFeatureAccess(packageTier, item.feature)) {
      const filtered: GatedNavItem = {
        ...item,
        children: item.children
          ? filterNavigation(item.children, packageTier)
          : undefined,
      };
      acc.push(filtered);
    }

    return acc;
  }, [] as GatedNavItem[]);
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: PackageTier): string {
  const names: Record<PackageTier, string> = {
    PRO: 'Pro',
    ADVANCED: 'Advanced',
  };
  return names[tier];
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: PackageTier): string {
  const colors: Record<PackageTier, string> = {
    PRO: 'bg-blue-100 text-blue-700',
    ADVANCED: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  };
  return colors[tier];
}
