import { useEffect, useState, useCallback, useRef } from 'react';
import { NativeEventEmitter } from 'react-native';
import NativeModuleRegistry from '../native/NativeModuleRegistry';
import { useNativeAdsManagerContext } from '../contexts/NativeAdsManagerContext';
import { validatePlacementId, FacebookAdsException, FacebookAdsErrorCode } from '../utils/errorHandling';

/**
 * Hook to interact with native ads through NativeAdsManager
 */
export function useNativeAdsManager(
  placementId: string,
  adsToRequest: number = 10
) {
  const { getManagerState, subscribe } = useNativeAdsManagerContext();
  const [state, setState] = useState(() => {
    const existing = getManagerState(placementId);
    return existing || {
      placementId,
      isValid: false,
      isLoading: true,
      error: null,
      adsAvailable: 0,
    };
  });

  useEffect(() => {
    try {
      validatePlacementId(placementId);
      // Initialize native manager
      NativeModuleRegistry.NativeAdManager.init(placementId, adsToRequest);

      // Subscribe to state changes
      const unsubscribe = subscribe(placementId, setState);
      return unsubscribe;
    } catch (error) {
      const fbError =
        error instanceof FacebookAdsException
          ? error
          : new FacebookAdsException(
              FacebookAdsErrorCode.INVALID_CONFIG,
              'useNativeAdsManager',
              error instanceof Error ? error.message : 'Unknown error'
            );
      setState((prev) => ({ ...prev, error: fbError, isLoading: false }));
      return;
    }
  }, [placementId, adsToRequest, subscribe]);

  return state;
}

/**
 * Hook to load and display interstitial ads
 */
export function useInterstitialAd() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FacebookAdsException | null>(null);

  const showAd = useCallback(async (placementId: string): Promise<boolean> => {
    try {
      validatePlacementId(placementId);
      setLoading(true);
      setError(null);

      const result = await NativeModuleRegistry.Interstitial.showAd(placementId);
      return result;
    } catch (err) {
      const fbError =
        err instanceof FacebookAdsException
          ? err
          : new FacebookAdsException(
              FacebookAdsErrorCode.AD_DISPLAY_FAILED,
              'useInterstitialAd.showAd',
              err instanceof Error ? err.message : 'Failed to show interstitial ad'
            );
      setError(fbError);
      throw fbError;
    } finally {
      setLoading(false);
    }
  }, []);

  const preloadAd = useCallback(async (placementId: string): Promise<boolean> => {
    try {
      validatePlacementId(placementId);
      setLoading(true);
      setError(null);

      const result = await NativeModuleRegistry.Interstitial.preloadAd(placementId);
      return result;
    } catch (err) {
      const fbError =
        err instanceof FacebookAdsException
          ? err
          : new FacebookAdsException(
              FacebookAdsErrorCode.AD_LOAD_FAILED,
              'useInterstitialAd.preloadAd',
              err instanceof Error ? err.message : 'Failed to preload interstitial ad'
            );
      setError(fbError);
      throw fbError;
    } finally {
      setLoading(false);
    }
  }, []);

  const showPreloadedAd = useCallback(
    async (placementId: string): Promise<boolean> => {
      try {
        validatePlacementId(placementId);
        setLoading(true);
        setError(null);

        const result = await NativeModuleRegistry.Interstitial.showPreloadedAd(placementId);
        return result;
      } catch (err) {
        const fbError =
          err instanceof FacebookAdsException
            ? err
            : new FacebookAdsException(
                FacebookAdsErrorCode.AD_DISPLAY_FAILED,
                'useInterstitialAd.showPreloadedAd',
                err instanceof Error ? err.message : 'Failed to show preloaded interstitial ad'
              );
        setError(fbError);
        throw fbError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    showAd,
    preloadAd,
    showPreloadedAd,
    loading,
    error,
  };
}

/**
 * Hook for native ad view interaction
 */
export function useNativeAdRef() {
  const nativeAdViewRef = useRef<number | null>(null);
  const mediaViewNodeHandle = useRef<number>(-1);
  const adIconViewNodeHandle = useRef<number>(-1);
  const clickableChildren = useRef<Set<number>>(new Set());

  const registerMediaView = useCallback((handle: number) => {
    mediaViewNodeHandle.current = handle;
  }, []);

  const unregisterMediaView = useCallback(() => {
    mediaViewNodeHandle.current = -1;
  }, []);

  const registerAdIconView = useCallback((handle: number) => {
    adIconViewNodeHandle.current = handle;
  }, []);

  const unregisterAdIconView = useCallback(() => {
    adIconViewNodeHandle.current = -1;
  }, []);

  const registerClickableChild = useCallback((handle: number) => {
    clickableChildren.current.add(handle);
  }, []);

  const unregisterClickableChild = useCallback((handle: number) => {
    clickableChildren.current.delete(handle);
  }, []);

  const registerViewsForInteraction = useCallback(async (): Promise<boolean> => {
    if (!nativeAdViewRef.current) {
      return false;
    }

    try {
      const clickable = Array.from(clickableChildren.current);
      return await NativeModuleRegistry.NativeAdManager.registerViewsForInteraction(
        nativeAdViewRef.current,
        mediaViewNodeHandle.current,
        adIconViewNodeHandle.current,
        clickable
      );
    } catch (error) {
      console.error('[FacebookAds] Failed to register views for interaction:', error);
      return false;
    }
  }, []);

  return {
    nativeAdViewRef,
    mediaViewNodeHandle,
    adIconViewNodeHandle,
    clickableChildren: clickableChildren.current,
    registerMediaView,
    unregisterMediaView,
    registerAdIconView,
    unregisterAdIconView,
    registerClickableChild,
    unregisterClickableChild,
    registerViewsForInteraction,
  };
}

/**
 * Hook to listen for native ad events
 */
export function useNativeAdEvents(placementId: string) {
  const [ad, setAd] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FacebookAdsException | null>(null);

  useEffect(() => {
    try {
      const emitter = new NativeEventEmitter(NativeModuleRegistry.NativeAdEmitter as any);

      const handleAdLoaded = (adData: any) => {
        if (adData?.placementId === placementId) {
          setAd(adData.ad);
          setIsLoading(false);
          setError(null);
        }
      };

      const handleAdError = (errorData: any) => {
        if (errorData?.placementId === placementId) {
          const fbError = new FacebookAdsException(
            FacebookAdsErrorCode.AD_LOAD_FAILED,
            'NativeAdManager',
            errorData.message || 'Failed to load native ad'
          );
          setError(fbError);
          setIsLoading(false);
        }
      };

      setIsLoading(true);
      const adLoadedSub = emitter.addListener('nativeAdLoaded', handleAdLoaded);
      const errorSub = emitter.addListener('nativeAdError', handleAdError);

      return () => {
        adLoadedSub.remove();
        errorSub.remove();
      };
    } catch (err) {
      const fbError =
        err instanceof FacebookAdsException
          ? err
          : new FacebookAdsException(
              FacebookAdsErrorCode.NATIVE_ERROR,
              'useNativeAdEvents',
              err instanceof Error ? err.message : 'Failed to setup native ad events'
            );
      setError(fbError);
      setIsLoading(false);
      return undefined;
    }
  }, [placementId]);

  return { ad, isLoading, error };
}
