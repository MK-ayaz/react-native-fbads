import React, { createContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { NativeEventEmitter } from 'react-native';
import NativeModuleRegistry from '../native/NativeModuleRegistry';
import { FacebookAdsException, FacebookAdsErrorCode } from '../utils/errorHandling';

/**
 * State of a native ads manager
 */
export interface NativeAdsManagerState {
  placementId: string;
  isValid: boolean;
  isLoading: boolean;
  error: FacebookAdsException | null;
  adsAvailable: number;
}

/**
 * Context value type for NativeAdsManager state
 */
export interface NativeAdsManagerContextValue {
  managers: Map<string, NativeAdsManagerState>;
  subscribe(
    placementId: string,
    callback: (state: NativeAdsManagerState) => void
  ): () => void;
  getManagerState(placementId: string): NativeAdsManagerState | undefined;
}

/**
 * Global context for managing native ads state
 */
export const NativeAdsManagerContext = createContext<NativeAdsManagerContextValue | undefined>(
  undefined
);

interface NativeAdsManagerProviderProps {
  children: ReactNode;
}

/**
 * Provider component for NativeAdsManager state
 */
export const NativeAdsManagerProvider: React.FC<NativeAdsManagerProviderProps> = ({
  children,
}) => {
  const [managers, setManagers] = useState<Map<string, NativeAdsManagerState>>(new Map());
  const [subscriptions, setSubscriptions] = useState<
    Map<string, Set<(state: NativeAdsManagerState) => void>>
  >(new Map());

  // Setup native event emitter listener
  useEffect(() => {
    try {
      const emitter = new NativeEventEmitter(NativeModuleRegistry.NativeAdEmitter as any);

      const handleManagersChanged = (managersData: Record<string, boolean>) => {
        setManagers((prevManagers) => {
          const updatedManagers = new Map(prevManagers);
          for (const [placementId, isValid] of Object.entries(managersData)) {
            const existing = updatedManagers.get(placementId);
            if (existing) {
              const updated = { ...existing, isValid };
              updatedManagers.set(placementId, updated);

              // Notify subscribed callbacks
              const subs = subscriptions.get(placementId);
              if (subs) {
                subs.forEach((callback) => callback(updated));
              }
            }
          }
          return updatedManagers;
        });
      };

      const handleAdError = (errorData: { placementId?: string; message: string }) => {
        const placementId = errorData.placementId;
        if (placementId) {
          setManagers((prevManagers) => {
            const updatedManagers = new Map(prevManagers);
            const existing = updatedManagers.get(placementId);
            if (existing) {
              const error = new FacebookAdsException(
                FacebookAdsErrorCode.AD_LOAD_FAILED,
                'NativeAdManager',
                errorData.message || 'Failed to load ads'
              );
              const updated = { ...existing, error, isLoading: false };
              updatedManagers.set(placementId, updated);

              // Notify subscribed callbacks
              const subs = subscriptions.get(placementId);
              if (subs) {
                subs.forEach((callback) => callback(updated));
              }
            }
            return updatedManagers;
          });
        }
      };

      const managersChangedSub = emitter.addListener('CTKNativeAdsManagersChanged', handleManagersChanged);
      const errorSub = emitter.addListener('onAdError', handleAdError);

      return () => {
        managersChangedSub.remove();
        errorSub.remove();
      };
    } catch (error) {
      console.error('[FacebookAds] Failed to setup native event emitter:', error);
      return undefined;
    }
  }, [subscriptions]);

  const subscribe = useCallback(
    (placementId: string, callback: (state: NativeAdsManagerState) => void) => {
      let currentSubs = subscriptions.get(placementId);
      if (!currentSubs) {
        currentSubs = new Set();
        setSubscriptions((prev) => new Map(prev).set(placementId, currentSubs!));
      }
      currentSubs.add(callback);

      // Return unsubscribe function
      return () => {
        currentSubs!.delete(callback);
        if (currentSubs!.size === 0) {
          setSubscriptions((prev) => {
            const updated = new Map(prev);
            updated.delete(placementId);
            return updated;
          });
        }
      };
    },
    [subscriptions]
  );

  const getManagerState = useCallback(
    (placementId: string): NativeAdsManagerState | undefined => {
      return managers.get(placementId);
    },
    [managers]
  );

  const value: NativeAdsManagerContextValue = {
    managers,
    subscribe,
    getManagerState,
  };

  return (
    <NativeAdsManagerContext.Provider value={value}>
      {children}
    </NativeAdsManagerContext.Provider>
  );
};

/**
 * Hook to access NativeAdsManager context
 */
export function useNativeAdsManagerContext(): NativeAdsManagerContextValue {
  const context = React.useContext(NativeAdsManagerContext);
  if (!context) {
    throw new Error(
      '`useNativeAdsManagerContext` must be used within <NativeAdsManagerProvider>'
    );
  }
  return context;
}
