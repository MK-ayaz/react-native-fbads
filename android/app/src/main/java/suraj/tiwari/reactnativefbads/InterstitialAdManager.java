package suraj.tiwari.reactnativefbads;

import com.facebook.ads.Ad;
import com.facebook.ads.AdError;
import com.facebook.ads.InterstitialAd;
import com.facebook.ads.InterstitialAdListener;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class InterstitialAdManager extends ReactContextBaseJavaModule
    implements InterstitialAdListener, LifecycleEventListener {

  public static final String NAME = "CTKInterstitialAdManager";

  private Promise mShowPromise;
  private Promise mPreloadPromise;
  private InterstitialAd mInterstitial;
  private String mCurrentPlacementId;
  private boolean mDidClick = false;
  private boolean mShowWhenLoaded = false;
  private boolean mIsPreloaded = false;

  public InterstitialAdManager(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @ReactMethod
  public void loadAd(String placementId, Promise promise) {
    preloadAd(placementId, promise);
  }

  @ReactMethod
  public void showAd(String placementId, Promise promise) {
    if (hasPendingOperation()) {
      promise.reject("E_FAILED_TO_SHOW", "An interstitial ad operation is already in progress");
      return;
    }

    destroyInterstitial();
    mCurrentPlacementId = placementId;
    mShowPromise = promise;
    mShowWhenLoaded = true;
    mDidClick = false;
    mIsPreloaded = false;

    ReactApplicationContext reactContext = getReactApplicationContext();
    mInterstitial = new InterstitialAd(reactContext, placementId);
    mInterstitial.loadAd(mInterstitial.buildLoadAdConfig().withAdListener(this).build());
  }

  @ReactMethod
  public void preloadAd(String placementId, Promise promise) {
    if (hasPendingOperation()) {
      promise.reject("E_FAILED_TO_PRELOAD", "An interstitial ad operation is already in progress");
      return;
    }

    if (mIsPreloaded && mInterstitial != null && placementId.equals(mCurrentPlacementId)) {
      promise.resolve(true);
      return;
    }

    destroyInterstitial();
    mCurrentPlacementId = placementId;
    mPreloadPromise = promise;
    mShowWhenLoaded = false;
    mDidClick = false;
    mIsPreloaded = false;

    ReactApplicationContext reactContext = getReactApplicationContext();
    mInterstitial = new InterstitialAd(reactContext, placementId);
    mInterstitial.loadAd(mInterstitial.buildLoadAdConfig().withAdListener(this).build());
  }

  @ReactMethod
  public void showPreloadedAd(String placementId, Promise promise) {
    if (mShowPromise != null) {
      promise.reject("E_FAILED_TO_SHOW", "An interstitial ad is already being shown");
      return;
    }

    if (!mIsPreloaded || mInterstitial == null || mCurrentPlacementId == null
        || !mCurrentPlacementId.equals(placementId)) {
      promise.reject("E_AD_NOT_READY", "No preloaded interstitial ad is available for this placement");
      return;
    }

    mShowPromise = promise;
    mDidClick = false;
    mShowWhenLoaded = false;

    if (mInterstitial.isAdLoaded()) {
      mInterstitial.show();
      return;
    }

    mShowPromise.reject("E_AD_NOT_READY", "Preloaded interstitial ad is no longer available");
    mShowPromise = null;
    mIsPreloaded = false;
    destroyInterstitial();
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onError(Ad ad, AdError adError) {
    if (ad != mInterstitial) {
      return;
    }

    if (mPreloadPromise != null) {
      mPreloadPromise.reject("E_FAILED_TO_LOAD", adError.getErrorMessage());
      mPreloadPromise = null;
    }

    if (mShowPromise != null) {
      mShowPromise.reject("E_FAILED_TO_LOAD", adError.getErrorMessage());
      mShowPromise = null;
    }

    mIsPreloaded = false;
    mShowWhenLoaded = false;
    destroyInterstitial();
  }

  @Override
  public void onAdLoaded(Ad ad) {
    if (ad != mInterstitial) {
      return;
    }

    if (mShowWhenLoaded) {
      mInterstitial.show();
      return;
    }

    mIsPreloaded = true;
    if (mPreloadPromise != null) {
      mPreloadPromise.resolve(true);
      mPreloadPromise = null;
    }
  }

  @Override
  public void onAdClicked(Ad ad) {
    if (ad == mInterstitial) {
      mDidClick = true;
    }
  }

  @Override
  public void onInterstitialDismissed(Ad ad) {
    if (ad != mInterstitial) {
      return;
    }

    if (mShowPromise != null) {
      mShowPromise.resolve(mDidClick);
      mShowPromise = null;
    }

    mIsPreloaded = false;
    mShowWhenLoaded = false;
    mDidClick = false;
    destroyInterstitial();
  }

  @Override
  public void onInterstitialDisplayed(Ad ad) {
  }

  @Override
  public void onLoggingImpression(Ad ad) {
  }

  @Override
  public void onHostResume() {
  }

  @Override
  public void onHostPause() {
  }

  @Override
  public void onHostDestroy() {
    if (mShowPromise != null) {
      mShowPromise.reject("E_DESTROYED", "Host was destroyed before interstitial completed");
      mShowPromise = null;
    }
    if (mPreloadPromise != null) {
      mPreloadPromise.reject("E_DESTROYED", "Host was destroyed before preload completed");
      mPreloadPromise = null;
    }
    mIsPreloaded = false;
    mShowWhenLoaded = false;
    mDidClick = false;
    destroyInterstitial();
  }

  private boolean hasPendingOperation() {
    return mShowPromise != null || mPreloadPromise != null;
  }

  private void destroyInterstitial() {
    if (mInterstitial != null) {
      mInterstitial.destroy();
      mInterstitial = null;
    }
  }
}
