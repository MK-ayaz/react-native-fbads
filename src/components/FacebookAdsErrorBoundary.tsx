import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { FacebookAdsException, getTelemetryService } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: FacebookAdsException, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: FacebookAdsException | null;
}

/**
 * Error boundary component for Facebook Ads
 * Catches and gracefully handles errors from ad components
 */
export class FacebookAdsErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown): State {
    const fbError =
      error instanceof FacebookAdsException
        ? error
        : new FacebookAdsException(
            'UNKNOWN' as any,
            'ErrorBoundary',
            error instanceof Error ? error.message : 'Unknown error occurred'
          );

    return {
      hasError: true,
      error: fbError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const fbError =
      error instanceof FacebookAdsException
        ? error
        : new FacebookAdsException(
            'UNKNOWN' as any,
            'ErrorBoundary',
            error.message
          );

    // Record error to telemetry
    getTelemetryService().recordError(fbError);

    // Call user's error handler if provided
    this.props.onError?.(fbError, errorInfo);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[FacebookAds] Error caught by boundary:', error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback: invisible or minimal view
      return <View style={{ flex: 1, opacity: 0 }} />;
    }

    return this.props.children;
  }
}

/**
 * Fallback component for ad errors (optional UI)
 */
export const DefaultAdErrorFallback: React.FC<{ error?: FacebookAdsException }> = ({
  error,
}) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
    }}
  >
    <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
      {error?.message || 'Failed to load advertisement'}
    </Text>
  </View>
);
