import { NativeModules, TurboModuleRegistry, type TurboModule } from 'react-native';

export type SDKLogLevel = 'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification';

export type TrackingStatus = 'unavailable' | 'denied' | 'authorized' | 'restricted' | 'not-determined';

/**
 * Type-safe contract for CTKAdSettingsManager native module
 */
export interface NativeAdSettingsModuleType extends TurboModule {
  readonly currentDeviceHash: string;
  addTestDevice(deviceHash: string): void;
  clearTestDevices(): void;
  setLogLevel(logLevel: SDKLogLevel): void;
  setIsChildDirected(isDirected: boolean): void;
  setMediationService(mediationService: string): void;
  setUrlPrefix(urlPrefix: string): void;
  requestTrackingPermission(): Promise<TrackingStatus>;
  getTrackingStatus(): Promise<TrackingStatus>;
  setAdvertiserIDCollectionEnabled?(enabled: boolean): void;
  setAdvertiserTrackingEnabled?(enabled: boolean): void;
}

/**
 * Type-safe contract for CTKInterstitialAdManager native module
 */
export interface NativeInterstitialModuleType extends TurboModule {
  showAd(placementId: string): Promise<boolean>;
  preloadAd(placementId: string): Promise<boolean>;
  showPreloadedAd(placementId: string): Promise<boolean>;
}

/**
 * Type-safe contract for CTKNativeAdManager native module
 */
export interface NativeAdManagerModuleType extends TurboModule {
  init(placementId: string, adsToRequest: number): void;
  registerViewsForInteraction(
    nativeAdViewTag: number,
    mediaViewTag: number,
    adIconViewTag: number,
    clickable: number[]
  ): Promise<boolean>;
  disableAutoRefresh?(placementId: string): void;
  setMediaCachePolicy?(placementId: string, policy: string): void;
}

/**
 * Type-safe contract for CTKNativeAdEmitter native module
 */
export interface NativeAdEmitterModuleType extends TurboModule {
  addListener(eventName: string, callback: (data: any) => void): void;
  removeListener(eventName: string, callback: (data: any) => void): void;
}

/**
 * Registry for all native modules with type safety and error handling
 */
class NativeModuleRegistry {
  private adSettingsModule: NativeAdSettingsModuleType | null = null;

  private interstitialModule: NativeInterstitialModuleType | null = null;

  private nativeAdManagerModule: NativeAdManagerModuleType | null = null;

  private nativeAdEmitterModule: NativeAdEmitterModuleType | null = null;

  /**
   * Safely retrieve or throw a typed native module
   */
  private getModule<T extends TurboModule>(
    moduleName: string,
    legacyModule: T | undefined
  ): T {
    const turboModule = TurboModuleRegistry.get<T>(moduleName);
    const resolvedModule = turboModule ?? legacyModule;

    if (!resolvedModule) {
      throw new Error(
        `[FacebookAds] Native module "${moduleName}" not found. ` +
          'Make sure the library is properly linked and the native code is compiled.'
      );
    }
    return resolvedModule;
  }

  get AdSettings(): NativeAdSettingsModuleType {
    if (!this.adSettingsModule) {
      this.adSettingsModule = this.getModule<NativeAdSettingsModuleType>(
        'CTKAdSettingsManager',
        NativeModules.CTKAdSettingsManager as NativeAdSettingsModuleType | undefined
      );
    }
    return this.adSettingsModule;
  }

  get Interstitial(): NativeInterstitialModuleType {
    if (!this.interstitialModule) {
      this.interstitialModule = this.getModule<NativeInterstitialModuleType>(
        'CTKInterstitialAdManager',
        NativeModules.CTKInterstitialAdManager as NativeInterstitialModuleType | undefined
      );
    }
    return this.interstitialModule;
  }

  get NativeAdManager(): NativeAdManagerModuleType {
    if (!this.nativeAdManagerModule) {
      this.nativeAdManagerModule = this.getModule<NativeAdManagerModuleType>(
        'CTKNativeAdManager',
        NativeModules.CTKNativeAdManager as NativeAdManagerModuleType | undefined
      );
    }
    return this.nativeAdManagerModule;
  }

  get NativeAdEmitter(): NativeAdEmitterModuleType {
    if (!this.nativeAdEmitterModule) {
      this.nativeAdEmitterModule = this.getModule<NativeAdEmitterModuleType>(
        'CTKNativeAdEmitter',
        NativeModules.CTKNativeAdEmitter as NativeAdEmitterModuleType | undefined
      );
    }
    return this.nativeAdEmitterModule;
  }

  /**
   * Reset all cached modules (useful for testing)
   */
  reset(): void {
    this.adSettingsModule = null;
    this.interstitialModule = null;
    this.nativeAdManagerModule = null;
    this.nativeAdEmitterModule = null;
  }
}

export default new NativeModuleRegistry();
