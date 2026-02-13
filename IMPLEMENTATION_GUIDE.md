# React Native Facebook Ads v8.0.0 - Implementation Guide

**Version**: 8.0.0 (2026)  
**Status**: Production-Ready  
**Last Updated**: February 13, 2026

## Quick Start (5 Minutes)

### Step 1: Install
```bash
npm install react-native-fbads@^8.0.0
cd ios && pod install && cd ..
```

### Step 2: Wrap App
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

### Step 3: Add Banner Ad
```typescript
import { BannerView } from 'react-native-fbads';

export function HomeScreen() {
  return (
    <View>
      {/* Content */}
      <BannerView placementId="YOUR_ID_HERE" size="HEIGHT_50" />
    </View>
  );
}
```

---

## Complete Implementation Examples

### Example 1: E-Commerce App with Banner Ads

```typescript
// screens/ProductListScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { BannerView } from 'react-native-fbads';

const BANNER_PLACEMENT_ID = 'YOUR_BANNER_PLACEMENT_ID';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Fetch products from API
      const response = await fetch('https://api.example.com/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {/* Banner ad at bottom */}
      <BannerView
        placementId={BANNER_PLACEMENT_ID}
        size="HEIGHT_50"
        onPress={() => console.log('Banner clicked')}
        onError={(error) => console.warn('Banner error:', error.message)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  productCard: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover'
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  }
});
```

### Example 2: Gaming App with Interstitial Ads

```typescript
// screens/GameScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { useInterstitialAd } from 'react-native-fbads';

const INTERSTITIAL_PLACEMENT_ID = Platform.select({
  ios: 'YOUR_IOS_INTERSTITIAL_ID',
  android: 'YOUR_ANDROID_INTERSTITIAL_ID'
}) || '';

interface GameState {
  score: number;
  level: number;
  gameOver: boolean;
}

export function GameScreen() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameOver: false
  });
  const { showAd, preloadAd, loading } = useInterstitialAd();

  // Preload ad on mount
  useEffect(() => {
    void preloadAd(INTERSTITIAL_PLACEMENT_ID);
  }, [preloadAd]);

  const handleGameOver = async () => {
    setGameState(prev => ({ ...prev, gameOver: true }));

    // Show interstitial every 3 levels
    if (gameState.level % 3 === 0) {
      try {
        const shown = await showAd(INTERSTITIAL_PLACEMENT_ID);
        if (shown) {
          console.log('Interstitial displayed after level', gameState.level);
        }
      } catch (error) {
        console.error('Failed to show interstitial:', error);
      }
    }

    // Reset game
    setTimeout(() => {
      setGameState({
        score: gameState.score,
        level: gameState.level + 1,
        gameOver: false
      });
      // Preload next interstitial
      void preloadAd(INTERSTITIAL_PLACEMENT_ID);
    }, 1000);
  };

  const handleRestart = () => {
    setGameState({
      score: 0,
      level: 1,
      gameOver: false
    });
  };

  return (
    <View style={styles.container}>
      {!gameState.gameOver ? (
        <View style={styles.gameContent}>
          <Text style={styles.title}>Level {gameState.level}</Text>
          <Text style={styles.score}>Score: {gameState.score}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              // Game logic here
              setGameState(prev => ({
                ...prev,
                score: prev.score + 10
              }));
            }}
          >
            <Text style={styles.buttonText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.gameOverButton]}
            onPress={handleGameOver}
          >
            <Text style={styles.buttonText}>End Game</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gameOverContent}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScore}>
            Final Score: {gameState.score}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRestart}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Play Again'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a'
  },
  gameContent: {
    alignItems: 'center'
  },
  gameOverContent: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff6b6b',
    padding: 30,
    borderRadius: 10
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  score: {
    fontSize: 24,
    color: '#4ecdc4',
    marginBottom: 40
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 20
  },
  finalScore: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 30
  },
  button: {
    backgroundColor: '#4ecdc4',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15
  },
  gameOverButton: {
    backgroundColor: '#ff6b6b'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
```

### Example 3: News App with Native Ads

```typescript
// screens/NewsScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import {
  useNativeAdsManager,
  withNativeAd,
  IFBNativeAd,
  FacebookAdsErrorBoundary,
  FacebookAdsErrorCode,
  FacebookAdsException
} from 'react-native-fbads';

const NATIVE_PLACEMENT_ID = 'YOUR_NATIVE_PLACEMENT_ID';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image: string;
  author: string;
  publishedAt: string;
}

// Native ad component
const NativeAdView = withNativeAd(
  ({ nativeAd }: { nativeAd?: IFBNativeAd }) => {
    if (!nativeAd) return null;

    return (
      <View style={styles.nativeAdContainer}>
        {nativeAd.image && (
          <Image
            source={{ uri: nativeAd.image.url }}
            style={styles.adImage}
          />
        )}
        <View style={styles.adContent}>
          <Text style={styles.adHeadline}>{nativeAd.headline}</Text>
          <Text style={styles.adBody} numberOfLines={2}>
            {nativeAd.bodyText}
          </Text>
          {nativeAd.callToActionText && (
            <TouchableOpacity style={styles.adButton}>
              <Text style={styles.adButtonText}>
                {nativeAd.callToActionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

// Article component
const ArticleCard = ({ article }: { article: NewsArticle }) => (
  <View style={styles.articleCard}>
    <Image source={{ uri: article.image }} style={styles.articleImage} />
    <View style={styles.articleContent}>
      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleBody} numberOfLines={3}>
        {article.content}
      </Text>
      <Text style={styles.articleMeta}>
        {article.author} • {article.publishedAt}
      </Text>
    </View>
  </View>
);

export function NewsScreen() {
  const { ads, loading, error } = useNativeAdsManager(
    NATIVE_PLACEMENT_ID,
    10
  );

  const articles: NewsArticle[] = [
    {
      id: '1',
      title: 'Breaking News',
      content: 'Latest news content...',
      image: 'https://...',
      author: 'John Doe',
      publishedAt: '2h ago'
    }
    // ... more articles
  ];

  const handleError = (err: FacebookAdsException) => {
    switch (err.code) {
      case FacebookAdsErrorCode.INVALID_PLACEMENT_ID:
        console.error('Invalid ad placement');
        break;
      case FacebookAdsErrorCode.AD_LOAD_FAILED:
        console.error('Failed to load ads');
        break;
      default:
        console.error('Ad error:', err.message);
    }
  };

  // Merge ads and articles, show ad every 4 articles
  const data = [];
  articles.forEach((article, index) => {
    data.push({ type: 'article', data: article });
    if ((index + 1) % 4 === 0 && ads.length > 0) {
      data.push({
        type: 'ad',
        data: ads[Math.floor(Math.random() * ads.length)]
      });
    }
  });

  const renderItem = ({
    item
  }: {
    item: { type: 'article' | 'ad'; data: NewsArticle | IFBNativeAd };
  }) => {
    if (item.type === 'article') {
      return <ArticleCard article={item.data as NewsArticle} />;
    }
    return <NativeAdView nativeAd={item.data as IFBNativeAd} />;
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load ads: {error.message}</Text>
      </View>
    );
  }

  return (
    <FacebookAdsErrorBoundary onError={handleError}>
      <View style={styles.container}>
        {loading && <ActivityIndicator color="#007AFF" />}
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.type === 'article'
              ? (item.data as NewsArticle).id
              : index.toString()
          }
        />
      </View>
    </FacebookAdsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  articleCard: {
    backgroundColor: '#fff',
    marginBottom: 10,
    overflow: 'hidden'
  },
  articleImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover'
  },
  articleContent: {
    padding: 12
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000'
  },
  articleBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20
  },
  articleMeta: {
    fontSize: 12,
    color: '#999'
  },
  nativeAdContainer: {
    backgroundColor: '#fff',
    marginBottom: 10,
    overflow: 'hidden'
  },
  adImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover'
  },
  adContent: {
    padding: 12
  },
  adHeadline: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000'
  },
  adBody: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18
  },
  adButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center'
  },
  adButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  }
});
```

---

## Setup Checklist

### Pre-Implementation
- [ ] Facebook Ads Manager account created
- [ ] App registered in Facebook Developers
- [ ] Placement IDs obtained (Banner, Interstitial, Native)
- [ ] App IDs for iOS and Android obtained
- [ ] Xcode 12+ installed (iOS)
- [ ] Android SDK 21+ configured (Android)

### Installation & Linking
- [ ] `npm install react-native-fbads@^8.0.0` completed
- [ ] `pod install` run for iOS
- [ ] Gradle sync completed for Android
- [ ] No build errors present

### Code Integration
- [ ] NativeAdsManagerProvider wraps root component
- [ ] Placement IDs added to environment variables
- [ ] Error boundaries integrated
- [ ] Loading states handled
- [ ] Permissions configured (iOS ATT, Android AD_ID)

### Testing
- [ ] Banner ads display correctly
- [ ] Interstitial ads preload and show
- [ ] Native ads render properly
- [ ] Error states handled gracefully
- [ ] No console warnings/errors

### Deployment
- [ ] Placement IDs verified for production
- [ ] Error logging enabled for monitoring
- [ ] App tested on physical devices
- [ ] No memory leaks detected
- [ ] Ready for production release

---

## Common Patterns

### Safe Ad Display with Fallback
```typescript
function SafeAdView() {
  const [showAd, setShowAd] = useState(true);

  return (
    <FacebookAdsErrorBoundary
      onError={(error) => {
        console.error('Ad failed:', error);
        setShowAd(false);
      }}
    >
      {showAd ? (
        <BannerView placementId="ID" size="HEIGHT_50" />
      ) : (
        <View style={{ height: 50, backgroundColor: '#f0f0f0' }} />
      )}
    </FacebookAdsErrorBoundary>
  );
}
```

### Conditional Ad Display
```typescript
function ConditionalAds() {
  const { user } = useAuth();
  const isUserPremium = user?.isPremium || false;

  if (isUserPremium) {
    return null; // Don't show ads to premium users
  }

  return <BannerView placementId="ID" size="HEIGHT_50" />;
}
```

### Multiple Ad Formats
```typescript
export function MultiAdScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Banner at top */}
      <BannerView
        placementId={BANNER_ID}
        size="HEIGHT_50"
        onError={() => console.warn('Banner error')}
      />

      {/* Main content */}
      <ScrollView>{/* Your content */}</ScrollView>

      {/* Native ads in list */}
      <NativeAdList placementId={NATIVE_ID} />

      {/* Interstitial on demand */}
      <InterstitialButton placementId={INTERSTITIAL_ID} />
    </View>
  );
}
```

---

## Performance Considerations

### Memory Management
```typescript
// Good: Cleanup subscriptions
useEffect(() => {
  const subscription = manager.onAdsLoaded(handleLoaded);
  return () => subscription?.remove(); // Important!
}, [manager]);
```

### Ad Caching
```typescript
// Configure caching strategy
configureFacebookAds({
  cachePolicy: 'on', // 'on', 'off', or 'default'
  requestTimeoutMs: 5000 // Timeout for ad requests
});
```

### Debug Mode
```typescript
configureFacebookAds({
  enableDebugLogging: __DEV__, // Only in development
  enablePerformanceMonitoring: true
});
```

---

## Deployment Guide

### iOS Deployment Steps
```bash
# 1. Update Podspec
pod repo update
cd ios && pod update && cd ..

# 2. Archive for production
xcodebuild -workspace ios/YourApp.xcworkspace \
  -scheme YourApp \
  -configuration Release \
  -archivePath build/YourApp.xcarchive archive
```

### Android Deployment Steps
```bash
# 1. Build release APK
cd android && ./gradlew assembleRelease && cd ..

# 2. Build release AAB (for Play Store)
cd android && ./gradlew bundleRelease && cd ..
```

---

## Support

**Documentation**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)  
**API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)  
**GitHub**: [react-native-fbads](https://github.com/callstack/react-native-fbads)

---

**Last Updated**: February 13, 2026
