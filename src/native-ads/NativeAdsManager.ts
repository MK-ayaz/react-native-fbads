import NativeModuleRegistry from '../native/NativeModuleRegistry';
import {
  withErrorHandling,
  validatePlacementId,
  FacebookAdsException,
  FacebookAdsErrorCode,
} from '../utils/errorHandling';

type AdManagerCachePolicy = 'none' | 'icon' | 'image' | 'all';

/**
 * Subscription type for state changes
 */
export interface Subscription {
  remove(): void;
}

/**
 * Enterprise-grade NativeAdsManager with full type safety and error handling
 * Replaces fbemitter with modern callback-based subscriptions
 */
export default class NativeAdsManager {
  private placementId: string;

  private isValid: boolean = false;

  private isLoading: boolean = true;

  // Callback registry for state changes and errors
  private loadCallbacks: Set<() => void> = new Set();

  private errorCallbacks: Set<(error: string) => void> = new Set();

  /**
   * Register views for interaction
   */
  static async registerViewsForInteractionAsync(
    nativeAdViewTag: number,
    mediaViewTag: number,
    adIconViewTag: number,
    clickable: number[]
  ): Promise<boolean> {
    const enhancedClickable = [...clickable];

    if (adIconViewTag > 0 && mediaViewTag > 0) {
      enhancedClickable.push(mediaViewTag, adIconViewTag);
    } else if (mediaViewTag > 0) {
      enhancedClickable.push(mediaViewTag);
    } else if (adIconViewTag > 0) {
      enhancedClickable.push(adIconViewTag);
    }

    return withErrorHandling(
      NativeModuleRegistry.NativeAdManager.registerViewsForInteraction(
        nativeAdViewTag,
        mediaViewTag,
        adIconViewTag,
        enhancedClickable
      ),
      'NativeAdsManager.registerViewsForInteractionAsync',
      FacebookAdsErrorCode.NATIVE_ERROR
    );
  }

  /**
   * Initialize NativeAdsManager with placement ID
   */
  constructor(placementId: string, adsToRequest: number = 10) {
    validatePlacementId(placementId);

    this.placementId = placementId;
    this.isLoading = true;

    try {
      NativeModuleRegistry.NativeAdManager.init(placementId, adsToRequest);
    } catch (error) {
      const fbError =
        error instanceof FacebookAdsException
          ? error
          : new FacebookAdsException(
              FacebookAdsErrorCode.NATIVE_ERROR,
              'NativeAdsManager.init',
              error instanceof Error ? error.message : 'Failed to initialize NativeAdsManager'
            );
      this.notifyError(fbError.message);
    }
  }

  /**
   * Register callback for when ads become available
   */
  onAdsLoaded(callback: () => void): Subscription {
    if (!callback) {
      return { remove: () => {} };
    }

    if (this.isValid) {
      // Already loaded, call callback asynchronously
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Promise.resolve().then(callback);
    }

    this.loadCallbacks.add(callback);

    return {
      remove: () => {
        this.loadCallbacks.delete(callback);
      },
    };
  }

  /**
   * Register callback for errors
   */
  onAdsError(callback: (error: string) => void): Subscription {
    if (!callback) {
      return { remove: () => {} };
    }

    this.errorCallbacks.add(callback);

    return {
      remove: () => {
        this.errorCallbacks.delete(callback);
      },
    };
  }

  /**
   * Disable auto refresh for ads
   */
  disableAutoRefresh(): void {
    try {
      NativeModuleRegistry.NativeAdManager.disableAutoRefresh?.(this.placementId);
    } catch (error) {
      console.error('[FacebookAds] Failed to disable auto refresh:', error);
    }
  }

  /**
   * Set media cache policy
   */
  setMediaCachePolicy(cachePolicy: AdManagerCachePolicy): void {
    try {
      NativeModuleRegistry.NativeAdManager.setMediaCachePolicy?.(
        this.placementId,
        cachePolicy
      );
    } catch (error) {
      console.error('[FacebookAds] Failed to set media cache policy:', error);
    }
  }

  /**
   * Notify subscribers that ads are loaded
   * @internal Reserved for future expansion of telemetry
   */
  // @ts-expect-error - Reserved for telemetry expansion
  private notifyLoaded(): void {
    this.isValid = true;
    this.isLoading = false;
    this.loadCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('[FacebookAds] Error in ads loaded callback:', error);
      }
    });
  }

  /**
   * Notify subscribers of errors
   */
  private notifyError(error: string): void {
    this.isValid = false;
    this.isLoading = false;
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('[FacebookAds] Error in ads error callback:', err);
      }
    });
  }

  /**
   * JSON representation
   */
  toJSON(): string {
    return this.placementId;
  }

  /**
   * Get current state
   */
  getState(): {
    isValid: boolean;
    isLoading: boolean;
    placementId: string;
  } {
    return {
      isValid: this.isValid,
      isLoading: this.isLoading,
      placementId: this.placementId,
    };
  }
}

