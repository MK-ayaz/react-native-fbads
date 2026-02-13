import {
  configureFacebookAds,
  getFacebookAdsConfig,
  resetFacebookAdsConfig,
  updateFacebookAdsConfig,
} from '../config/FacebookAdsConfig';
import { DefaultTelemetryService } from '../utils/errorHandling';

describe('FacebookAdsConfig', () => {
  beforeEach(() => {
    resetFacebookAdsConfig();
  });

  describe('configureFacebookAds', () => {
    it('should set configuration', () => {
      configureFacebookAds({
        enableDebugLogging: true,
        enableTelemetry: true,
        requestTimeoutMs: 5000,
        cachePolicy: 'aggressive',
      });

      const config = getFacebookAdsConfig();
      expect(config.enableDebugLogging).toBe(true);
      expect(config.requestTimeoutMs).toBe(5000);
      expect(config.cachePolicy).toBe('aggressive');
    });

    it('should merge with existing configuration', () => {
      configureFacebookAds({
        enableDebugLogging: true,
      });

      configureFacebookAds({
        requestTimeoutMs: 8000,
      });

      const config = getFacebookAdsConfig();
      expect(config.enableDebugLogging).toBe(true);
      expect(config.requestTimeoutMs).toBe(8000);
    });
  });

  describe('getFacebookAdsConfig', () => {
    it('should return current configuration', () => {
      const config = getFacebookAdsConfig();
      expect(config.enableDebugLogging).toBe(false);
      expect(config.enableTelemetry).toBe(true);
      expect(config.cachePolicy).toBe('lazy');
    });

    it('should return frozen object', () => {
      const config = getFacebookAdsConfig();
      expect(() => {
        (config as any).enableDebugLogging = true;
      }).toThrow();
    });
  });

  describe('updateFacebookAdsConfig', () => {
    it('should update single config option', () => {
      updateFacebookAdsConfig('enableDebugLogging', true);
      const config = getFacebookAdsConfig();
      expect(config.enableDebugLogging).toBe(true);
    });

    it('should update timeout', () => {
      updateFacebookAdsConfig('requestTimeoutMs', 7000);
      const config = getFacebookAdsConfig();
      expect(config.requestTimeoutMs).toBe(7000);
    });
  });

  describe('resetFacebookAdsConfig', () => {
    it('should reset to defaults', () => {
      configureFacebookAds({
        enableDebugLogging: true,
        requestTimeoutMs: 20000,
      });

      resetFacebookAdsConfig();

      const config = getFacebookAdsConfig();
      expect(config.enableDebugLogging).toBe(false);
      expect(config.requestTimeoutMs).toBe(10000);
      expect(config.cachePolicy).toBe('lazy');
    });
  });

  describe('Custom telemetry service', () => {
    it('should accept custom telemetry service', () => {
      const customService = new DefaultTelemetryService();
      configureFacebookAds({
        telemetryService: customService,
      });

      const config = getFacebookAdsConfig();
      expect(config.telemetryService).toBe(customService);
    });
  });
});
