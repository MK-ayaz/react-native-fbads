import {
  FacebookAdsException,
  FacebookAdsErrorCode,
  withErrorHandling,
  validatePlacementId,
  createSafeCallback,
  setTelemetryService,
  DefaultTelemetryService,
} from '../utils/errorHandling';

describe('FacebookAdsException', () => {
  it('should create exception with all properties', () => {
    const error = new FacebookAdsException(
      FacebookAdsErrorCode.AD_LOAD_FAILED,
      'TestModule',
      'Test message',
      new Error('Original error')
    );

    expect(error.code).toBe(FacebookAdsErrorCode.AD_LOAD_FAILED);
    expect(error.nativeModule).toBe('TestModule');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('FacebookAdsException');
    expect(error instanceof FacebookAdsException).toBe(true);
  });

  it('should serialize to JSON', () => {
    const error = new FacebookAdsException(
      FacebookAdsErrorCode.INVALID_PLACEMENT_ID,
      'TestModule',
      'Test message'
    );

    const json = error.toJSON();
    expect(json.code).toBe(FacebookAdsErrorCode.INVALID_PLACEMENT_ID);
    expect(json.nativeModule).toBe('TestModule');
    expect(json.message).toBe('Test message');
    expect(json.timestamp).toBeDefined();
  });
});

describe('validatePlacementId', () => {
  it('should accept valid placement IDs', () => {
    expect(() => validatePlacementId('valid-id')).not.toThrow();
  });

  it('should throw on empty string', () => {
    expect(() => validatePlacementId('')).toThrow(FacebookAdsException);
  });

  it('should throw on null/undefined', () => {
    expect(() => validatePlacementId(null as any)).toThrow(FacebookAdsException);
  });

  it('should throw on whitespace-only string', () => {
    expect(() => validatePlacementId('   ')).toThrow(FacebookAdsException);
  });
});

describe('withErrorHandling', () => {
  it('should pass through successful promises', async () => {
    const result = await withErrorHandling(
      Promise.resolve('success'),
      'test'
    );
    expect(result).toBe('success');
  });

  it('should wrap rejected promises', async () => {
    const originalError = new Error('Original error');
    await expect(
      withErrorHandling(Promise.reject(originalError), 'test')
    ).rejects.toThrow(FacebookAdsException);
  });
});

describe('createSafeCallback', () => {
  it('should call callback without error', () => {
    const callback = jest.fn().mockReturnValue('result');
    const safeCallback = createSafeCallback(callback);

    const result = safeCallback();
    expect(callback).toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('should handle callback errors gracefully', () => {
    const callback = jest.fn().mockImplementation(() => {
      throw new Error('Callback error');
    });
    const errorHandler = jest.fn();
    const safeCallback = createSafeCallback(callback, errorHandler);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    safeCallback();
    expect(errorHandler).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return undefined for undefined callback', () => {
    const safeCallback = createSafeCallback(undefined);
    const result = safeCallback();
    expect(result).toBeUndefined();
  });
});

describe('Telemetry Service', () => {
  it('should record events', () => {
    const telemetryService = new DefaultTelemetryService();
    const recordEventSpy = jest.spyOn(telemetryService, 'recordEvent');

    telemetryService.recordEvent({
      type: 'event',
      context: 'test',
    });

    expect(recordEventSpy).toHaveBeenCalled();
  });

  it('should record errors', () => {
    const telemetryService = new DefaultTelemetryService();
    const recordErrorSpy = jest.spyOn(telemetryService, 'recordError');

    const error = new FacebookAdsException(
      FacebookAdsErrorCode.NATIVE_ERROR,
      'test',
      'Error message'
    );
    telemetryService.recordError(error);

    expect(recordErrorSpy).toHaveBeenCalledWith(error);
  });

  it('should record performance metrics', () => {
    const telemetryService = new DefaultTelemetryService();
    const recordPerformanceSpy = jest.spyOn(telemetryService, 'recordPerformance');

    telemetryService.recordPerformance('test-operation', 1500);

    expect(recordPerformanceSpy).toHaveBeenCalledWith('test-operation', 1500);
  });
});
