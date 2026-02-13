export {
  FacebookAdsException,
  FacebookAdsErrorCode,
  withErrorHandling,
  createSafeCallback,
  validatePlacementId,
  setTelemetryService,
  getTelemetryService,
  DefaultTelemetryService,
} from './errorHandling';
export type { TelemetryEvent, ITelemetryService } from './errorHandling';
