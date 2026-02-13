import { Platform } from 'react-native';
import NativeModuleRegistry from './native/NativeModuleRegistry';
import { withErrorHandling } from './utils/errorHandling';

export type { SDKLogLevel, TrackingStatus } from './native/NativeModuleRegistry';

/**
 * Facebook Ads Settings API with type safety and error handling
 */
const AdSettings = {
  /**
   * Get the hash of the device id for test ads
   */
  get currentDeviceHash(): string {
    try {
      return NativeModuleRegistry.AdSettings.currentDeviceHash;
    } catch (error) {
      console.error('[FacebookAds] Failed to get device hash:', error);
      return '';
    }
  },

  /**
   * Register a device to receive test ads
   */
  addTestDevice(deviceHash: string): void {
    try {
      if (!deviceHash || typeof deviceHash !== 'string') {
        throw new Error('Device hash must be a non-empty string');
      }
      NativeModuleRegistry.AdSettings.addTestDevice(deviceHash);
    } catch (error) {
      console.error('[FacebookAds] Failed to add test device:', error);
    }
  },

  /**
   * Clear all test devices
   */
  clearTestDevices(): void {
    try {
      NativeModuleRegistry.AdSettings.clearTestDevices();
    } catch (error) {
      console.error('[FacebookAds] Failed to clear test devices:', error);
    }
  },

  /**
   * Set SDK log level
   */
  setLogLevel(logLevel: 'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification'): void {
    try {
      NativeModuleRegistry.AdSettings.setLogLevel(logLevel);
    } catch (error) {
      console.error('[FacebookAds] Failed to set log level:', error);
    }
  },

  /**
   * Set whether ads are child-directed
   */
  setIsChildDirected(isDirected: boolean): void {
    try {
      NativeModuleRegistry.AdSettings.setIsChildDirected(isDirected);
    } catch (error) {
      console.error('[FacebookAds] Failed to set child-directed status:', error);
    }
  },

  /**
   * Set mediation service
   */
  setMediationService(mediationService: string): void {
    try {
      NativeModuleRegistry.AdSettings.setMediationService(mediationService);
    } catch (error) {
      console.error('[FacebookAds] Failed to set mediation service:', error);
    }
  },

  /**
   * Set URL prefix
   */
  setUrlPrefix(urlPrefix: string): void {
    try {
      NativeModuleRegistry.AdSettings.setUrlPrefix(urlPrefix);
    } catch (error) {
      console.error('[FacebookAds] Failed to set URL prefix:', error);
    }
  },

  /**
   * Request app tracking permission (iOS 14+)
   */
  async requestTrackingPermission(): Promise<'unavailable' | 'denied' | 'authorized' | 'restricted' | 'not-determined'> {
    if (Platform.OS !== 'ios') {
      return 'unavailable';
    }
    return withErrorHandling(
      NativeModuleRegistry.AdSettings.requestTrackingPermission(),
      'requestTrackingPermission'
    );
  },

  /**
   * Get current tracking status (iOS 14+)
   */
  async getTrackingStatus(): Promise<'unavailable' | 'denied' | 'authorized' | 'restricted' | 'not-determined'> {
    if (Platform.OS !== 'ios') {
      return 'unavailable';
    }
    return withErrorHandling(
      NativeModuleRegistry.AdSettings.getTrackingStatus(),
      'getTrackingStatus'
    );
  },

  /**
   * Enable or disable the automatic Advertiser ID Collection
   */
  setAdvertiserIDCollectionEnabled(enabled: boolean): void {
    try {
      if (Platform.OS === 'ios') {
        NativeModuleRegistry.AdSettings.setAdvertiserIDCollectionEnabled?.(enabled);
      }
    } catch (error) {
      console.error('[FacebookAds] Failed to set advertiser ID collection:', error);
    }
  },

  /**
   * Enable or disable ads tracking (iOS 14+)
   */
  setAdvertiserTrackingEnabled(enabled: boolean): void {
    try {
      if (Platform.OS === 'ios') {
        NativeModuleRegistry.AdSettings.setAdvertiserTrackingEnabled?.(enabled);
      }
    } catch (error) {
      console.error('[FacebookAds] Failed to set advertiser tracking:', error);
    }
  },
};

export default AdSettings;
