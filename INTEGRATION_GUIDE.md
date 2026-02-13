# React Native Facebook Ads v8.0.0 - Integration Guide

**Version**: 8.0.0 (2026)  
**Status**: Production-Ready  
**Last Updated**: February 13, 2026

## Table of Contents

1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [Migration from v7](#migration-from-v7)
4. [Integration Patterns](#integration-patterns)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites
- React Native 0.70.0 or higher
- Node.js 16.0.0 or higher
- iOS: CocoaPods, Xcode 12+
- Android: Android SDK 21+

### Step 1: Install Package
```bash
npm install react-native-fbads@^8.0.0
# or
yarn add react-native-fbads@^8.0.0
```

### Step 2: Link Native Modules
```bash
# For React Native 0.60+, auto-linking should handle this
react-native link react-native-fbads

# For Expo projects:
expo install react-native-fbads
```

### Step 3: iOS Setup
```bash
cd ios
pod install
cd ..
```

### Step 4: Android Setup
No additional setup required - Gradle auto-linking handles it.

---

## Basic Setup

### 1. **Provider Setup** (Recommended)
```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NativeAdsManagerProvider } from 'react-native-fbads';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <NativeAdsManagerProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </NativeAdsManagerProvider>
  );
}
```

### 2. **Configure Ads** (Optional)
```typescript
// setupAds.ts
import { configureFacebookAds } from 'react-native-fbads';

export function initializeFacebookAds() {
  configureFacebookAds({
    enableDebugLogging: __DEV__,
    enableTelemetry: true,
    requestTimeoutMs: 3000,
    cachePolicy: 'on',
    enablePerformanceMonitoring: true
  });
}
```

Call this in your app startup:
```typescript
// App.tsx
import { initializeFacebookAds } from './setupAds';

useEffect(() => {
  initializeFacebookAds();
}, []);
```

---

## Migration from v7

### Breaking Changes
⚠️ **None!** - v8 is fully backward compatible with v7

### What Changed (Internal)
| Feature | v7 | v8 | Action Required |
|---------|----|----|-----------------|
| fbemitter | ✅ Required | ❌ Removed | Update imports (optional) |
| TypeScript | Partial | Complete | None (backward compatible) |
| Hooks API | ❌ None | ✅ Available | Optional migration |
| Global Config | ❌ None | ✅ Available | Optional optimization |

### Migration Path (Optional - Recommended)

**Phase 1: Update Imports** (If using TypeScript)
```typescript
// Before (v7)
import { AdSettings, NativeAdsManager, withNativeAd } from 'react-native-fbads';

// After (v8 - recommended)
import {
  AdSettings,
  NativeAdsManager,
  withNativeAd,
  // NEW: Hooks API
  useNativeAdsManager,
  useInterstitialAd,
  // NEW: Error handling
  FacebookAdsException,
  FacebookAdsErrorCode,
  // NEW: Global config
  configureFacebookAds
} from 'react-native-fbads';
```

**Phase 2: Migrate to Hooks (Optional)**
```typescript
// Before (v7 - class-based)
class AdScreen extends React.Component {
  constructor(props) {
    super(props);
    this.manager = new NativeAdsManager('YOUR_PLACEMENT_ID');
  }

  render() {
    return <BannerView placementId="YOUR_PLACEMENT_ID" />;
  }
}

// After (v8 - hooks-based, recommended)
function AdScreen() {
  const { ads, loading, error } = useNativeAdsManager('YOUR_PLACEMENT_ID', 5);

  if (error) {
    return <ErrorState error={error} />;
  }

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <FlatList
      data={ads}
      keyExtractor={(ad) => ad.hashCode}
      renderItem={({ item }) => <NativeAdView ad={item} />}
    />
  );
}
```

---

## Integration Patterns

### Pattern 1: **Banner Ads** (Simple)
```typescript
import React from 'react';
import { View } from 'react-native';
import { BannerView } from 'react-native-fbads';

export function BannerAdScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Your content */}
      {/* Banner at bottom */}
      <BannerView
        placementId="BANNER_PLACEMENT_ID"
        size="HEIGHT_50"
        onPress={() => console.log('Banner clicked')}
        onError={(error) => console.error('Banner error:', error)}
      />
    </View>
  );
}
```

### Pattern 2: **Interstitial Ads** (Full-screen)
```typescript
import { useInterstitialAd } from 'react-native-fbads';

export function InterstitialScreen() {
  const { showAd, preloadAd, loading, error } = useInterstitialAd();

  const handleShowInterstitial = async () => {
    try {
      const shown = await showAd('YOUR_INTERSTITIAL_PLACEMENT_ID');
      if (shown) {
        console.log('Interstitial displayed');
        // Navigate or proceed
      }
    } catch (err) {
      console.error('Failed to show interstitial:', err);
    }
  };

  useEffect(() => {
    // Preload before user triggers
    void preloadAd('YOUR_INTERSTITIAL_PLACEMENT_ID');
  }, [preloadAd]);

  return (
    <Button
      title="Watch Interstitial"
      onPress={handleShowInterstitial}
      loading={loading}
    />
  );
}
```

### Pattern 3: **Native Ads** (Complex - Recommended Hooks)
```typescript
import { useNativeAdsManager } from 'react-native-fbads';
import { withNativeAd } from 'react-native-fbads';

// Step 1: Create ad component with withNativeAd HOC
interface NativeAdCardProps {
  nativeAd?: facebook.NativeAd;
}

const NativeAdCard = withNativeAd(({ nativeAd }: NativeAdCardProps) => {
  if (!nativeAd) return null;

  return (
    <View style={styles.card}>
      <Image source={{ uri: nativeAd.image?.url }} style={styles.image} />
      <Text style={styles.headline}>{nativeAd.headline}</Text>
      <Text style={styles.body}>{nativeAd.bodyText}</Text>
      <Button title={nativeAd.callToActionText} onPress={() => {}} />
    </View>
  );
});

// Step 2: Use in screen
export function NativeAdScreen() {
  const { ads, loading, error } = useNativeAdsManager(
    'YOUR_NATIVE_PLACEMENT_ID',
    10 // Request 10 ads
  );

  if (loading) return <ActivityIndicator />;
  if (error) return <ErrorState error={error} />;

  return (
    <FlatList
      data={ads}
      keyExtractor={(ad) => ad.hashCode}
      renderItem={({ item }) => <NativeAdCard nativeAd={item} />}
    />
  );
}
```

### Pattern 4: **Error Handling** (Best Practice)
```typescript
import {
  FacebookAdsException,
  FacebookAdsErrorCode,
  FacebookAdsErrorBoundary
} from 'react-native-fbads';

export function AdScreenWithErrorHandling() {
  const handleError = (error: FacebookAdsException) => {
    switch (error.code) {
      case FacebookAdsErrorCode.INVALID_PLACEMENT_ID:
        console.error('Invalid placement ID');
        break;
      case FacebookAdsErrorCode.AD_LOAD_FAILED:
        console.error('Failed to load ad', error.message);
        break;
      case FacebookAdsErrorCode.REQUEST_TIMEOUT:
        console.error('Request timed out');
        break;
      default:
        console.error('Unknown error:', error);
    }
  };

  return (
    <FacebookAdsErrorBoundary
      onError={handleError}
      fallback={<ErrorPlaceholder />}
    >
      <NativeAdScreen />
    </FacebookAdsErrorBoundary>
  );
}
```

### Pattern 5: **Global Configuration** (App-wide)
```typescript
// config/ads.ts
import { configureFacebookAds, updateFacebookAdsConfig } from 'react-native-fbads';

export const initializeAds = () => {
  configureFacebookAds({
    enableDebugLogging: __DEV__,
    enableTelemetry: true,
    requestTimeoutMs: 5000,
    cachePolicy: 'on',
    enablePerformanceMonitoring: true
  });
};

export const updateAdConfig = (updates: Partial<FacebookAdsConfig>) => {
  updateFacebookAdsConfig(updates);
};
```

---

## Best Practices

### ✅ DO

1. **Wrap providers at root level**
   ```typescript
   <NativeAdsManagerProvider>
     <App />
   </NativeAdsManagerProvider>
   ```

2. **Preload ads before showing**
   ```typescript
   useEffect(() => {
     void preloadAd(placementId);
   }, [placementId]);
   ```

3. **Handle errors gracefully**
   ```typescript
   if (error) {
     return <FallbackUI />;
   }
   ```

4. **Use placement IDs from environment**
   ```typescript
   const PLACEMENT_ID = Platform.select({
     ios: process.env.FB_ADS_PLACEMENT_IOS,
     android: process.env.FB_ADS_PLACEMENT_ANDROID
   });
   ```

5. **Log with proper levels**
   ```typescript
   console.log('[Ads] Ad loaded');
   console.warn('[Ads] Low memory warning');
   console.error('[Ads] Loading failed:', error.message);
   ```

### ❌ DON'T

1. **Don't instantiate multiple managers for same placement**
   ```typescript
   // Bad
   const m1 = new NativeAdsManager(id);
   const m2 = new NativeAdsManager(id);

   // Good
   const manager = new NativeAdsManager(id);
   ```

2. **Don't ignore errors**
   ```typescript
   // Bad
   showAd(id).catch(() => {}); // Silent failure

   // Good
   showAd(id).catch(err => {
     reportError(err);
     showFallback();
   });
   ```

3. **Don't call hooks outside functional components**
   ```typescript
   // Bad
   class MyClass {
     const ads = useNativeAdsManager(id); // ❌ Error
   }

   // Good
   function MyComponent() {
     const ads = useNativeAdsManager(id); // ✅
   }
   ```

4. **Don't hardcode placement IDs in components**
   ```typescript
   // Bad
   <BannerView placementId="123456789" />

   // Good
   <BannerView placementId={PLACEMENT_IDS.banner} />
   ```

5. **Don't forget to unsubscribe from event listeners**
   ```typescript
   // Bad
   manager.onAdsLoaded(callback); // Leak!

   // Good
   const sub = manager.onAdsLoaded(callback);
   useEffect(() => {
     return () => sub.remove();
   }, []);
   ```

---

## Troubleshooting

### Issue: "Module not found: react-native-fbads"

**Solution:**
```bash
# Clear cache and reinstall
npm cache clean --force
npm install react-native-fbads@^8.0.0

# or yarn
yarn cache clean
yarn add react-native-fbads@^8.0.0
```

### Issue: "NativeAdsManagerProvider not found"

**Solution:**
Ensure you're using the v8.0.0+ exports:
```typescript
// ✅ Correct
import { NativeAdsManagerProvider } from 'react-native-fbads';

// ❌ Wrong
import { NativeAdsManagerProvider } from 'react-native-fbads/src/contexts';
```

### Issue: "No ads loading"

**Checklist:**
- [ ] Placement ID is correct (from Facebook Ads Manager)
- [ ] App has requested proper permissions (iOS: ATT, Android: AD_ID)
- [ ] Network connectivity is available
- [ ] Ad account is in good standing
- [ ] Check `enableDebugLogging: true` for details

### Issue: "TypeScript errors in hooks"

**Solution:**
Ensure you're targeting TypeScript 5.1+:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}
```

### Issue: "Ads not displaying on Android"

**Solution:**
Check AndroidManifest.xml permissions:
```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## Support & Resources

- **GitHub Issues**: [react-native-fbads](https://github.com/callstack/react-native-fbads/issues)
- **Facebook Ads SDK**: [Facebook Developers](https://developers.facebook.com/docs/audience-network)
- **TypeScript Docs**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **React Native Docs**: [React Native](https://reactnative.dev/)

---

## Version History

- **v8.0.0** (Feb 2026) - Complete modernization, Hooks API, Context, TypeScript 5.1
- **v7.1.0** (Previous) - Legacy version

---

**Last Updated**: February 13, 2026
