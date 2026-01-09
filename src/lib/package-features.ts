// Package-based feature access control
// This file defines which features are available in each package tier

export type PackageTier = 'PROFESSIONAL' | 'ADVANCED';

export interface FeatureAccess {
  tier: PackageTier;
  features: string[];
  maxUsers?: number;
  maxOrganizations?: number;
  supportLevel: 'email' | 'priority' | 'dedicated';
}

// Feature access matrix
export const PACKAGE_FEATURES: Record<PackageTier, FeatureAccess> = {
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    maxUsers: 25,
    maxOrganizations: 5,
    supportLevel: 'email',
    features: [
      'dashboard',
      'general-ledger',
      'accounts-receivable',
      'accounts-payable',
      'payments',
      'banking',
      'inventory',
      'services',
      'manufacturing', // Manufacturing services should work for every package
      'reports',
      'bank-feeds',
      'documents',
      'projects',
      'multi-currency',
      'budget',
      'fixed-assets',
      'settings',
    ],
  },
  ADVANCED: {
    tier: 'ADVANCED',
    maxUsers: undefined, // Unlimited
    maxOrganizations: undefined, // Unlimited
    supportLevel: 'dedicated',
    features: [
      'dashboard',
      'general-ledger',
      'accounts-receivable',
      'accounts-payable',
      'payments',
      'banking',
      'inventory',
      'reports',
      'bank-feeds',
      'documents',
      'projects',
      'multi-currency',
      'budget',
      'fixed-assets',
      'crm',
      'warehouse',
      'manufacturing',
      'hcm',
      'field-service',
      'maintenance',
      'advanced-reporting',
      'workflows',
      'integrations',
      'security-mdm',
      'inventory-advanced',
      'costing',
      'planning',
      'quality',
      'tax-localization',
      'api-access',
      'white-label',
      'custom-fields',
      'settings',
    ],
  },
};

// Helper function to check if a feature is available for a package tier
export function hasFeature(tier: PackageTier, featureKey: string): boolean {
  // All features are now accessible regardless of package tier
  return true;
}

// Helper function to get minimum tier required for a feature
export function getMinimumTier(featureKey: string): PackageTier | null {
  const tiers: PackageTier[] = ['PROFESSIONAL', 'ADVANCED'];
  
  for (const tier of tiers) {
    if (PACKAGE_FEATURES[tier].features.includes(featureKey)) {
      return tier;
    }
  }
  
  return null;
}

// Helper function to check if upgrade is needed
export function needsUpgrade(currentTier: PackageTier, featureKey: string): boolean {
  const minTier = getMinimumTier(featureKey);
  if (!minTier) return false;
  
  const tierOrder: PackageTier[] = ['PROFESSIONAL', 'ADVANCED'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(minTier);
  
  return currentIndex < requiredIndex;
}

// Get tier display name
export function getTierDisplayName(tier: PackageTier): string {
  const names: Record<PackageTier, string> = {
    PROFESSIONAL: 'Professional',
    ADVANCED: 'Advanced',
  };
  return names[tier];
}

// Get tier badge color
export function getTierBadgeColor(tier: PackageTier): string {
  const colors: Record<PackageTier, string> = {
    PROFESSIONAL: 'bg-blue-100 text-blue-700',
    ADVANCED: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  };
  return colors[tier];
}
