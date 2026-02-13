/**
 * Enterprise-grade error handling for Facebook Ads
 */

export enum FacebookAdsErrorCode {
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  INVALID_PLACEMENT_ID = 'INVALID_PLACEMENT_ID',
  AD_LOAD_FAILED = 'AD_LOAD_FAILED',
  AD_DISPLAY_FAILED = 'AD_DISPLAY_FAILED',
  NATIVE_ERROR = 'NATIVE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom exception for Facebook Ads errors with enterprise telemetry support
 */
export class FacebookAdsException extends Error {
  public readonly code: FacebookAdsErrorCode;

  public readonly nativeModule: string;

  public readonly timestamp: Date;

  public readonly originalError?: unknown;

  constructor(
    code: FacebookAdsErrorCode,
    nativeModule: string,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'FacebookAdsException';
    this.code = code;
    this.nativeModule = nativeModule;
    this.originalError = originalError;
    this.timestamp = new Date();

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FacebookAdsException.prototype);

    // Capture stack trace in development
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      nativeModule: this.nativeModule,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Wraps async operations with error handling and telemetry
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  context: string,
  expectedCode: FacebookAdsErrorCode = FacebookAdsErrorCode.NATIVE_ERROR
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new FacebookAdsException(expectedCode, context, message, error);
  }
}

/**
 * Creates a safe wrapper for callbacks that handles errors gracefully
 */
export function createSafeCallback<T extends (...args: any[]) => any>(
  callback: T | undefined,
  errorHandler?: (error: FacebookAdsException) => void
): T {
  if (!callback) {
    return (() => undefined) as T;
  }

  return ((...args: Parameters<T>) => {
    try {
      return callback(...args);
    } catch (error) {
      const fbError =
        error instanceof FacebookAdsException
          ? error
          : new FacebookAdsException(
              FacebookAdsErrorCode.UNKNOWN,
              'callback',
              error instanceof Error ? error.message : 'Unknown error',
              error
            );

      errorHandler?.(fbError);
      // Don't re-throw to prevent crash
      console.error('[FacebookAds] Error in callback:', fbError);
    }
  }) as T;
}

/**
 * Validates placement ID format
 */
export function validatePlacementId(placementId: string): void {
  if (!placementId || typeof placementId !== 'string' || placementId.trim().length === 0) {
    throw new FacebookAdsException(
      FacebookAdsErrorCode.INVALID_PLACEMENT_ID,
      'placement-validation',
      'Placement ID must be a non-empty string'
    );
  }
}

/**
 * Telemetry service for tracking errors and events
 */
export interface TelemetryEvent {
  type: 'error' | 'event' | 'performance';
  code?: FacebookAdsErrorCode;
  context: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ITelemetryService {
  recordEvent(event: TelemetryEvent): void;
  recordError(error: FacebookAdsException): void;
  recordPerformance(context: string, duration: number): void;
}

/**
 * No-op telemetry service (can be overridden by consumers)
 */
export class DefaultTelemetryService implements ITelemetryService {
  recordEvent(event: TelemetryEvent): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[FacebookAds] Event:', event);
    }
  }

  recordError(error: FacebookAdsException): void {
    console.error('[FacebookAds] Error recorded:', error.toJSON());
  }

  recordPerformance(context: string, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FacebookAds] Performance ${context}: ${duration}ms`);
    }
  }
}

let telemetryService: ITelemetryService = new DefaultTelemetryService();

export function setTelemetryService(service: ITelemetryService): void {
  telemetryService = service;
}

export function getTelemetryService(): ITelemetryService {
  return telemetryService;
}
