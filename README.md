# react-native-fbads [![npm version][version-badge]][package] [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Modern Facebook Audience Network integration with v8.0.0** - Complete TypeScript rewrite, Hooks API, React Context, and enterprise-grade error handling. Production-ready for 2026 and beyond.

[![Facebook Ads](http://i.imgur.com/yH3s6rd.png)](https://developers.facebook.com/products/app-monetization)

**Facebook Audience SDK** integration for React Native (0.70+), available on iOS and Android. Features native, interstitial and banner ads with modern Hooks API and full TypeScript support.

**Version**: 8.0.0 (February 2026) | **Status**: Production Ready ✅

## 📚 Documentation

**Start Here:**
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Installation, setup, and patterns (500+ lines)
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Real-world examples and best practices (600+ lines)
- **[MIGRATION.md](./MIGRATION.md)** - Upgrade from v7 to v8 (250+ lines)
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API documentation (350+ lines)
- **[PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md)** - Publishing and release process

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Linking](#linking)
- [Basic Usage](#basic-usage)
  - [Hooks API (Recommended)](#hooks-api-recommended)
  - [Banner Ads](#banner-ads)
  - [Interstitial Ads](#interstitial-ads)
  - [Native Ads](#native-ads)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
- [Running the Example](#running-the-example)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

- ✅ **Modern Hooks API** - `useNativeAdsManager()`, `useInterstitialAd()`, `useNativeAdRef()`
- ✅ **React Context** - `NativeAdsManagerProvider` for global state management
- ✅ **Full TypeScript** - 100% typed with TypeScript 5.1, strict mode enabled
- ✅ **Error Handling** - `FacebookAdsException`, error codes, error boundaries
- ✅ **Global Configuration** - `configureFacebookAds()` for app-wide settings
- ✅ **Zero Dependencies** - Removed fbemitter, no state management deps
- ✅ **Backward Compatible** - All v7 APIs still work (zero breaking changes)
- ✅ **Enterprise Grade** - Error tracking, telemetry support, performance monitoring
- ✅ **Type Safe Native Bridge** - `NativeModuleRegistry` with full contracts
- ✅ **Modern Tooling** - ESLint, Prettier, Jest, built-in

## 📋 Prerequisites

### Requirements
- **Node.js**: 16.0.0 or higher
- **React Native**: 0.70.0 or higher
- **iOS**: Xcode 12+, CocoaPods
- **Android**: Android SDK 21+

### Account Setup
1. Create [Facebook Developer](https://developers.facebook.com/) account
2. Integrate [Facebook SDK](https://github.com/thebergamo/react-native-fbsdk-next)
3. Create Placement IDs in [Facebook Ads Manager](https://www.facebook.com/adsmanager/)
4. Add test devices and users ([instructions](https://developers.facebook.com/docs/audience-network/guides/test))

**Get Device IDs:**
- **Android**: Settings > Google > Ads > AAID
- **iOS**: Use third-party App Store app or `xcrun simctl list 'devices' 'booted'` for simulator

## 🚀 Installation

### npm
```bash
npm install react-native-fbads@^8.0.0
```

### yarn
```bash
yarn add react-native-fbads@^8.0.0
```

### Expo
```bash
expo install react-native-fbads
```

### pnpm
```bash
pnpm add react-native-fbads@^8.0.0
```

## 🔗 Linking

### React Native 0.60+ (Auto-linking)

The CLI autolink feature automatically links the module during the build process.

**iOS**: Install Pods
```bash
cd ios && pod install && cd ..
```

**Android**: No additional setup required (Gradle handles it automatically)

<details>
<summary>React Native < 0.60 (Manual Linking)</summary>

```bash
react-native link react-native-fbads
```

</details>

## ⚡ Quick Start (5 Minutes)

### 1. Provider Setup
```typescript
// App.tsx
import { NativeAdsManagerProvider } from 'react-native-fbads';

export default function App() {
  return (
    <NativeAdsManagerProvider>
      {/* Your app */}
    </NativeAdsManagerProvider>
  );
}
```

### 2. Add Banner Ads
```typescript
import { BannerView } from 'react-native-fbads';

export function HomeScreen() {
  return (
    <BannerView
      placementId="YOUR_BANNER_PLACEMENT_ID"
      size="HEIGHT_50"
    />
  );
}
```

### 3. Interstitial Ads
```typescript
import { useInterstitialAd } from 'react-native-fbads';

export function RewardScreen() {
  const { showAd, preloadAd, loading } = useInterstitialAd();

  useEffect(() => {
    void preloadAd('YOUR_INTERSTITIAL_ID');
  }, [preloadAd]);

  const handleShowAd = async () => {
    const shown = await showAd('YOUR_INTERSTITIAL_ID');
    if (shown) {
      // User watched the ad
    }
  };

  return <Button title="Watch Ad" onPress={handleShowAd} />;
}
```

### 4. Native Ads
```typescript
import { useNativeAdsManager, withNativeAd } from 'react-native-fbads';

const NativeAdCard = withNativeAd(({ nativeAd }) => (
  <View>
    <Text>{nativeAd?.headline}</Text>
    <Text>{nativeAd?.bodyText}</Text>
    <Button title={nativeAd?.callToActionText} />
  </View>
));

export function FeedScreen() {
  const { ads, loading } = useNativeAdsManager('YOUR_NATIVE_ID', 10);

  return (
    <FlatList
      data={ads}
      renderItem={({ item }) => <NativeAdCard nativeAd={item} />}
    />
  );
}
```

---

## 📖 Basic Usage

### Expo Setup

> This package requires custom native code and cannot run in "Expo Go".

After installing, add the config plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-fbsdk-next",
        {
          "appID": "YOUR_APP_ID",
          "clientToken": "YOUR_CLIENT_TOKEN",
          "displayName": "Your App Name"
        }
      ],
      "react-native-fbads"
    ]
  }
}
```

Then rebuild: `expo prebuild && expo run:ios` (or `:android`)

---

## 🎯 Hooks API (Recommended)

### useNativeAdsManager
```typescript
const { ads, loading, error } = useNativeAdsManager(
  'YOUR_PLACEMENT_ID',
  10  // Request 10 ads
);
```

### useInterstitialAd
```typescript
const { showAd, preloadAd, loading, error } = useInterstitialAd();
```

### useNativeAdRef
```typescript
const ref = useNativeAdRef();
```

### useNativeAdEvents
```typescript
useNativeAdEvents(manager, {
  onLoaded: () => {},
  onError: (err) => {},
  onImpressionLogged: () => {}
});
```

See [API_REFERENCE.md](./API_REFERENCE.md) for complete details.

---

## ⚙️ Configuration

```typescript
import { configureFacebookAds } from 'react-native-fbads';

configureFacebookAds({
  enableDebugLogging: __DEV__,
  enableTelemetry: true,
  requestTimeoutMs: 5000,
  cachePolicy: 'on',
  enablePerformanceMonitoring: true
});
```

---

## 🛡️ Error Handling

```typescript
import {
  FacebookAdsErrorBoundary,
  FacebookAdsException,
  FacebookAdsErrorCode
} from 'react-native-fbads';

export function AdScreen() {
  const handleError = (error: FacebookAdsException) => {
    if (error.code === FacebookAdsErrorCode.AD_LOAD_FAILED) {
      console.error('Failed to load ad');
      // Show fallback UI
    }
  };

  return (
    <FacebookAdsErrorBoundary onError={handleError}>
      <YourAdComponent />
    </FacebookAdsErrorBoundary>
  );
}
```

---

## 📖 Complete Documentation

This README provides quick start information. For comprehensive guides, see:

| Document | Content | Audience |
|----------|---------|----------|
| **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** | Installation, patterns, troubleshooting | Everyone starting out |
| **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** | Real-world examples: E-Commerce, Gaming, News | App builders & developers |
| **[MIGRATION.md](./MIGRATION.md)** | Upgrading from v7.x to v8.0 | Existing v7 users |
| **[API_REFERENCE.md](./API_REFERENCE.md)** | Complete API documentation | API consumers |
| **[PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md)** | Release & deployment process | Maintainers |

---

## 🚀 Running the Example

### Prerequisites
- Placement ID from Facebook Ads Manager
- Facebook SDK linked in example project
- iOS: `cd example/ios && pod install && cd ../..`

### Run Example App
```bash
cd example && npm install
npm start

# iOS
npm run ios

# Android
npm run android
```

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Version**: 8.0.0 | **Updated**: Feb 13, 2026 | **Status**: Production Ready ✅

---

<!-- badges -->

[version-badge]: https://img.shields.io/npm/v/react-native-fbads.svg?style=flat-square
[package]: https://www.npmjs.com/package/react-native-fbads

