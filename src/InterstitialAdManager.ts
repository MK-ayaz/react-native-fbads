import NativeModuleRegistry from './native/NativeModuleRegistry';
import { withErrorHandling, validatePlacementId, FacebookAdsErrorCode } from './utils/errorHandling';

/**
 * Enterprise-grade Interstitial Ad Manager with full error handling
 */
const InterstitialAdManager = {
  /**
   * Load and display an interstitial ad immediately
   */
  async showAd(placementId: string): Promise<boolean> {
    validatePlacementId(placementId);
    return withErrorHandling(
      NativeModuleRegistry.Interstitial.showAd(placementId),
      'InterstitialAdManager.showAd',
      FacebookAdsErrorCode.AD_DISPLAY_FAILED
    );
  },

  /**
   * Preload an interstitial ad without displaying it
   */
  async preloadAd(placementId: string): Promise<boolean> {
    validatePlacementId(placementId);
    return withErrorHandling(
      NativeModuleRegistry.Interstitial.preloadAd(placementId),
      'InterstitialAdManager.preloadAd',
      FacebookAdsErrorCode.AD_LOAD_FAILED
    );
  },

  /**
   * Display a previously preloaded interstitial ad
   */
  async showPreloadedAd(placementId: string): Promise<boolean> {
    validatePlacementId(placementId);
    return withErrorHandling(
      NativeModuleRegistry.Interstitial.showPreloadedAd(placementId),
      'InterstitialAdManager.showPreloadedAd',
      FacebookAdsErrorCode.AD_DISPLAY_FAILED
    );
  },
};

export default InterstitialAdManager;

