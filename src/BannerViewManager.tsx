import React, { useCallback, useMemo } from 'react';
import {
  requireNativeComponent,
  StyleProp,
  ViewStyle,
  View,
  StyleSheet,
} from 'react-native';
import { FacebookAdsException, validatePlacementId } from './utils/errorHandling';

type AdSize = 'large' | 'standard';

export interface BannerViewProps {
  /**
   * Type of banner: 'standard' (50pt height) or 'large' (90pt height)
   */
  type: AdSize;

  /**
   * Facebook placement ID for this banner
   */
  placementId: string;

  /**
   * Callback when the ad is pressed/clicked
   */
  onPress?: () => void;

  /**
   * Callback when the ad fails to load
   */
  onError?: (error: FacebookAdsException) => void;

  /**
   * Callback when the ad successfully loads
   */
  onLoad?: () => void;

  /**
   * Custom styles for the banner container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test ID for testing purposes
   */
  testID?: string;
}

interface NativeBannerViewProps {
  size: number;
  onAdPress: () => void;
  onAdError: (error: string) => void;
  onAdLoad: () => void;
  style: StyleProp<ViewStyle>;
  placementId: string;
  testID?: string;
}

// Native component bridge
const CTKBannerView = requireNativeComponent<NativeBannerViewProps>('CTKBannerView');

const SIZE_MAP: Record<AdSize, number> = {
  large: 90,
  standard: 50,
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

/**
 * Facebook Banner Ad component
 * Modern functional component with full type safety
 */
const BannerView = React.forwardRef<View, BannerViewProps>(
  (
    {
      type,
      placementId,
      onPress,
      onError,
      onLoad,
      style,
      testID,
    },
    ref
  ) => {
    const size = SIZE_MAP[type];

    // Validate placement ID
    useMemo(() => {
      try {
        validatePlacementId(placementId);
      } catch (error) {
        onError?.(error as FacebookAdsException);
      }
    }, [placementId, onError]);

    const handleAdPress = useCallback(() => {
      onPress?.();
    }, [onPress]);

    const handleAdError = useCallback((message: string) => {
      const error = new FacebookAdsException(
        'AD_LOAD_FAILED' as any,
        'BannerView',
        message
      );
      onError?.(error);
    }, [onError]);

    const handleAdLoad = useCallback(() => {
      onLoad?.();
    }, [onLoad]);

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          style,
          {
            height: size,
          },
        ]}
        testID={testID}
      >
        <CTKBannerView
          size={size}
          placementId={placementId}
          onAdPress={handleAdPress}
          onAdError={handleAdError}
          onAdLoad={handleAdLoad}
          style={{ flex: 1 }}
        />
      </View>
    );
  }
);

BannerView.displayName = 'BannerView';

export default BannerView;
