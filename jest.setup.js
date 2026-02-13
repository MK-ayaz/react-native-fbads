import { NativeModules } from 'react-native';

// Mock Facebook Ads native modules
Object.setPrototypeOf(NativeModules, {
  CTKAdSettingsManager: {
    currentDeviceHash: 'test-hash-123',
    addTestDevice: jest.fn(),
    clearTestDevices: jest.fn(),
    setLogLevel: jest.fn(),
    setIsChildDirected: jest.fn(),
    setMediationService: jest.fn(),
    setUrlPrefix: jest.fn(),
    requestTrackingPermission: jest.fn().mockResolvedValue('authorized'),
    getTrackingStatus: jest.fn().mockResolvedValue('authorized'),
  },
  CTKInterstitialAdManager: {
    showAd: jest.fn().mockResolvedValue(true),
    preloadAd: jest.fn().mockResolvedValue(true),
    showPreloadedAd: jest.fn().mockResolvedValue(true),
  },
  CTKNativeAdManager: {
    init: jest.fn(),
    registerViewsForInteraction: jest.fn().mockResolvedValue(true),
  },
  CTKNativeAdEmitter: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  CTKBannerView: {
    name: 'CTKBannerView',
  },
  CTKNativeAd: {
    name: 'CTKNativeAd',
  },
});
