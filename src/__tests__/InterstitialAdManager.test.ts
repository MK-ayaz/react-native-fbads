import InterstitialAdManager from '../InterstitialAdManager';
import NativeModuleRegistry from '../native/NativeModuleRegistry';
import { FacebookAdsException } from '../utils/errorHandling';

jest.mock('../native/NativeModuleRegistry');

describe('InterstitialAdManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showAd', () => {
    it('should call native showAd method', async () => {
      const showAdMock = jest.fn().mockResolvedValue(true);
      NativeModuleRegistry.Interstitial.showAd = showAdMock;

      const result = await InterstitialAdManager.showAd('test-placement-id');

      expect(result).toBe(true);
      expect(showAdMock).toHaveBeenCalledWith('test-placement-id');
    });

    it('should throw error on invalid placement ID', async () => {
      await expect(InterstitialAdManager.showAd('')).rejects.toThrow(
        FacebookAdsException
      );
    });

    it('should handle native errors', async () => {
      const error = new Error('Native error');
      const showAdMock = jest.fn().mockRejectedValue(error);
      NativeModuleRegistry.Interstitial.showAd = showAdMock;

      await expect(InterstitialAdManager.showAd('test-placement-id')).rejects.toThrow(
        FacebookAdsException
      );
    });
  });

  describe('preloadAd', () => {
    it('should call native preloadAd method', async () => {
      const preloadAdMock = jest.fn().mockResolvedValue(true);
      NativeModuleRegistry.Interstitial.preloadAd = preloadAdMock;

      const result = await InterstitialAdManager.preloadAd('test-placement-id');

      expect(result).toBe(true);
      expect(preloadAdMock).toHaveBeenCalledWith('test-placement-id');
    });
  });

  describe('showPreloadedAd', () => {
    it('should call native showPreloadedAd method', async () => {
      const showPreloadedMock = jest.fn().mockResolvedValue(true);
      NativeModuleRegistry.Interstitial.showPreloadedAd = showPreloadedMock;

      const result = await InterstitialAdManager.showPreloadedAd('test-placement-id');

      expect(result).toBe(true);
      expect(showPreloadedMock).toHaveBeenCalledWith('test-placement-id');
    });
  });
});
