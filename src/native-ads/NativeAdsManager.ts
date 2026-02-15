import NativeModuleRegistry from '../native/NativeModuleRegistry';
import {
  DeviceEventEmitter,
  EmitterSubscription,
  NativeEventEmitter,
  Platform,
} from 'react-native';
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
  private static instances: Set<NativeAdsManager> = new Set();

  private static managersChangedSubscription: EmitterSubscription | null = null;

  private static errorSubscription: EmitterSubscription | null = null;

  private placementId: string;

  private isValid: boolean = false;

  private isLoading: boolean = true;

  // Callback registry for state changes and errors
  private loadCallbacks: Set<() => void> = new Set();

  private errorCallbacks: Set<(error: string) => void> = new Set();

  private static ensureEventSubscriptions(): void {
    if (
      NativeAdsManager.managersChangedSubscription &&
      NativeAdsManager.errorSubscription
    ) {
      return;
    }

    const emitter =
      Platform.OS === 'ios'
        ? new NativeEventEmitter(NativeModuleRegistry.NativeAdEmitter as any)
        : DeviceEventEmitter;

    NativeAdsManager.managersChangedSubscription = emitter.addListener(
      'CTKNativeAdsManagersChanged',
      (managersData: Record<string, boolean>) => {
        NativeAdsManager.instances.forEach((instance) => {
          instance.handleManagersState(managersData);
        });
      }
    );

    NativeAdsManager.errorSubscription = emitter.addListener(
      'onAdError',
      (errorData: unknown) => {
        const message =
          typeof errorData === 'string'
            ? errorData
            : (errorData as { message?: string } | undefined)?.message ??
              'Native ad request failed';

        NativeAdsManager.instances.forEach((instance) => {
          if (instance.isLoading || !instance.isValid) {
            instance.notifyError(message);
          }
        });
      }
    );
  }

  private static cleanupEventSubscriptionsIfNeeded(): void {
    if (NativeAdsManager.instances.size > 0) {
      return;
    }

    NativeAdsManager.managersChangedSubscription?.remove();
    NativeAdsManager.errorSubscription?.remove();
    NativeAdsManager.managersChangedSubscription = null;
    NativeAdsManager.errorSubscription = null;
  }

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
    NativeAdsManager.instances.add(this);
    NativeAdsManager.ensureEventSubscriptions();

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

  private handleManagersState(managersData: Record<string, boolean>): void {
    if (!Object.prototype.hasOwnProperty.call(managersData, this.placementId)) {
      return;
    }

    const isReady = Boolean(managersData[this.placementId]);
    if (isReady) {
      if (this.isLoading || !this.isValid) {
        this.notifyLoaded();
      }
      return;
    }

    if (this.isLoading || this.isValid) {
      this.notifyError('Failed to load native ads');
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
   * Explicit cleanup for long-running screens that create/discard many managers
   */
  dispose(): void {
    NativeAdsManager.instances.delete(this);
    this.loadCallbacks.clear();
    this.errorCallbacks.clear();
    NativeAdsManager.cleanupEventSubscriptionsIfNeeded();
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

