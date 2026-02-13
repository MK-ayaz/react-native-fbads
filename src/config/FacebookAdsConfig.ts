import { ITelemetryService, DefaultTelemetryService, setTelemetryService } from '../utils/errorHandling';

export type CachePolicy = 'aggressive' | 'lazy' | 'none';

/**
 * Global configuration for Facebook Ads SDK
 */
export interface FacebookAdsConfig {
  /**
   * Enable debug logging in development
   * @default false
   */
  enableDebugLogging: boolean;

  /**
   * Enable error telemetry and tracking
   * @default true
   */
  enableTelemetry: boolean;

  /**
   * Custom telemetry service for error/event tracking
   * @default DefaultTelemetryService
   */
  telemetryService?: ITelemetryService;

  /**
   * Timeout for native ad requests in milliseconds
   * @default 10000 (10 seconds)
   */
  requestTimeoutMs: number;

  /**
   * Global cache policy for ads
   * - 'aggressive': Cache all ad data and assets
   * - 'lazy': Cache only when explicitly requested
   * - 'none': Never cache
   * @default 'lazy'
   */
  cachePolicy: CachePolicy;

  /**
   * Enable performance monitoring
   * @default false
   */
  enablePerformanceMonitoring: boolean;

  /**
   * Custom endpoint for telemetry (if telemetryService not provided)
   * @default undefined
   */
  telemetryEndpoint?: string;
}

const DEFAULT_CONFIG: FacebookAdsConfig = {
  enableDebugLogging: false,
  enableTelemetry: true,
  requestTimeoutMs: 10000,
  cachePolicy: 'lazy',
  enablePerformanceMonitoring: false,
};

let globalConfig: FacebookAdsConfig = { ...DEFAULT_CONFIG };

/**
 * Configure Facebook Ads globally
 */
export function configureFacebookAds(config: Partial<FacebookAdsConfig>): void {
  globalConfig = {
    ...globalConfig,
    ...config,
  };

  // Apply telemetry service if provided
  if (config.telemetryService) {
    setTelemetryService(config.telemetryService);
  } else if (config.enableTelemetry && !config.telemetryService) {
    // Use default if not disabled
    setTelemetryService(new DefaultTelemetryService());
  }

  if (globalConfig.enableDebugLogging) {
    console.log('[FacebookAds] Configuration updated:', globalConfig);
  }
}

/**
 * Get current global configuration
 */
export function getFacebookAdsConfig(): Readonly<FacebookAdsConfig> {
  return Object.freeze({ ...globalConfig });
}

/**
 * Reset configuration to defaults
 */
export function resetFacebookAdsConfig(): void {
  globalConfig = { ...DEFAULT_CONFIG };
}

/**
 * Update a single config option
 */
export function updateFacebookAdsConfig<K extends keyof FacebookAdsConfig>(
  key: K,
  value: FacebookAdsConfig[K]
): void {
  globalConfig[key] = value;

  if (globalConfig.enableDebugLogging) {
    console.log(`[FacebookAds] Config "${key}" updated to:`, value);
  }
}
