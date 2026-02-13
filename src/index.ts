/**
 * React Native Facebook Ads SDK - v8.0.0
 * Modern, enterprise-grade Facebook Audience Network integration for React Native
 * with full TypeScript support, hooks API, error handling, and performance monitoring
 */

// Legacy class-based API (maintained for backwards compatibility)
export { default as NativeAdsManager } from './native-ads/NativeAdsManager';
export { default as InterstitialAdManager } from './InterstitialAdManager';
export { default as AdSettings } from './AdSettings';
export { default as BannerView } from './BannerViewManager';

// Native Ad Components (legacy)
export { default as MediaView } from './native-ads/MediaViewManager';
export { default as AdIconView } from './native-ads/AdIconViewManager';
export { default as TriggerableView } from './native-ads/TriggerableView';
export { default as AdChoicesView } from './native-ads/AdChoicesManager';
export { default as withNativeAd } from './native-ads/withNativeAd';

// Native Ad Types
export * from './native-ads/nativeAd';

// Modern Hooks API (new, recommended)
export { useNativeAdsManager, useInterstitialAd, useNativeAdRef, useNativeAdEvents } from './hooks';

// Context Provider (required for hooks API)
export { NativeAdsManagerProvider } from './contexts/NativeAdsManagerContext';
export type { NativeAdsManagerContextValue, NativeAdsManagerState } from './contexts/NativeAdsManagerContext';

// Error Handling (enterprise-grade)
export {
  FacebookAdsException,
  FacebookAdsErrorCode,
  withErrorHandling,
  createSafeCallback,
  validatePlacementId,
  setTelemetryService,
  getTelemetryService,
} from './utils/errorHandling';
export type { TelemetryEvent, ITelemetryService } from './utils/errorHandling';

// Error Boundary Component
export { FacebookAdsErrorBoundary, DefaultAdErrorFallback } from './components/FacebookAdsErrorBoundary';

// Global Configuration
export {
  configureFacebookAds,
  getFacebookAdsConfig,
  resetFacebookAdsConfig,
  updateFacebookAdsConfig,
} from './config/FacebookAdsConfig';
export type { FacebookAdsConfig } from './config/FacebookAdsConfig';

// Native Module Registry (advanced usage)
export { default as NativeModuleRegistry } from './native/NativeModuleRegistry';
export type {
  NativeAdSettingsModuleType,
  NativeInterstitialModuleType,
  NativeAdManagerModuleType,
  NativeAdEmitterModuleType,
  SDKLogLevel,
  TrackingStatus,
} from './native/NativeModuleRegistry';
