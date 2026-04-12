// Feature flags configuration for paid/free features
// This allows you to globally control if features are free or paid

export const FEATURE_FLAGS = {
  // Set to true to make custom layouts FREE for all users
  // Set to false to make custom layouts a PAID feature only
  CUSTOM_LAYOUT_FREE: true,

  // Add more feature flags here as needed
  // EXAMPLE_FEATURE_FREE: true,
} as const;

// Helper function to check if a feature is enabled for an event
export function isFeatureEnabled(featureKey: keyof typeof FEATURE_FLAGS, eventHasPaidFeatures: boolean): boolean {
  // If feature is globally free, everyone gets it
  if (FEATURE_FLAGS[featureKey]) {
    return true;
  }

  // If feature is paid-only, only paid users get it
  return eventHasPaidFeatures;
}

// Specific helper for custom layout feature
export function canUseCustomLayout(eventHasPaidFeatures: boolean): boolean {
  return isFeatureEnabled('CUSTOM_LAYOUT_FREE', eventHasPaidFeatures);
}
