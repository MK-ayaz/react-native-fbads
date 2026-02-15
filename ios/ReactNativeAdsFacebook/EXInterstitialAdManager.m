#import "EXInterstitialAdManager.h"
#import "EXUnversioned.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <React/RCTUtils.h>

@interface EXInterstitialAdManager () <FBInterstitialAdDelegate>

@property (nonatomic, copy) RCTPromiseResolveBlock showResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock showReject;
@property (nonatomic, copy) RCTPromiseResolveBlock preloadResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock preloadReject;
@property (nonatomic, strong) FBInterstitialAd *interstitialAd;
@property (nonatomic, strong) UIViewController *adViewController;
@property (nonatomic, copy) NSString *currentPlacementId;
@property (nonatomic, assign) BOOL didClick;
@property (nonatomic, assign) BOOL showWhenLoaded;
@property (nonatomic, assign) BOOL isPreloaded;
@property (nonatomic, assign) BOOL isBackground;

@end

@implementation EXInterstitialAdManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(CTKInterstitialAdManager)

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

RCT_EXPORT_METHOD(showAd:(NSString *)placementId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self hasPendingOperation]) {
    reject(@"E_FAILED_TO_SHOW", @"An interstitial ad operation is already in progress", nil);
    return;
  }

  if (_isBackground) {
    reject(@"E_FAILED_TO_SHOW", @"`showAd` can be called only when app is in foreground", nil);
    return;
  }

  [self destroyInterstitial];

  _currentPlacementId = placementId;
  _showResolve = [resolve copy];
  _showReject = [reject copy];
  _showWhenLoaded = YES;
  _didClick = NO;
  _isPreloaded = NO;

  _interstitialAd = [[FBInterstitialAd alloc] initWithPlacementID:placementId];
  _interstitialAd.delegate = self;
  [_interstitialAd loadAd];
}

RCT_EXPORT_METHOD(preloadAd:(NSString *)placementId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self hasPendingOperation]) {
    reject(@"E_FAILED_TO_PRELOAD", @"An interstitial ad operation is already in progress", nil);
    return;
  }

  if (_isPreloaded && _interstitialAd && [_currentPlacementId isEqualToString:placementId]) {
    resolve(@(YES));
    return;
  }

  if (_isBackground) {
    reject(@"E_FAILED_TO_PRELOAD", @"`preloadAd` can be called only when app is in foreground", nil);
    return;
  }

  [self destroyInterstitial];

  _currentPlacementId = placementId;
  _preloadResolve = [resolve copy];
  _preloadReject = [reject copy];
  _showWhenLoaded = NO;
  _didClick = NO;
  _isPreloaded = NO;

  _interstitialAd = [[FBInterstitialAd alloc] initWithPlacementID:placementId];
  _interstitialAd.delegate = self;
  [_interstitialAd loadAd];
}

RCT_EXPORT_METHOD(showPreloadedAd:(NSString *)placementId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (_showResolve != nil) {
    reject(@"E_FAILED_TO_SHOW", @"An interstitial ad is already being shown", nil);
    return;
  }

  if (!_isPreloaded || _interstitialAd == nil || ![_currentPlacementId isEqualToString:placementId]) {
    reject(@"E_AD_NOT_READY", @"No preloaded interstitial ad is available for this placement", nil);
    return;
  }

  if (![_interstitialAd isAdValid]) {
    _isPreloaded = NO;
    [self destroyInterstitial];
    reject(@"E_AD_NOT_READY", @"Preloaded interstitial ad is no longer valid", nil);
    return;
  }

  _showResolve = [resolve copy];
  _showReject = [reject copy];
  _didClick = NO;
  _showWhenLoaded = NO;

  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_interstitialAd showAdFromRootViewController:RCTPresentedViewController()];
  });
}

#pragma mark - FBInterstitialAdDelegate

- (void)interstitialAdDidLoad:(FBInterstitialAd *)interstitialAd
{
  if (interstitialAd != _interstitialAd) {
    return;
  }

  if (_showWhenLoaded) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self->_interstitialAd showAdFromRootViewController:RCTPresentedViewController()];
    });
    return;
  }

  _isPreloaded = YES;
  if (_preloadResolve) {
    _preloadResolve(@(YES));
    [self clearPreloadPromise];
  }
}

- (void)interstitialAd:(FBInterstitialAd *)interstitialAd didFailWithError:(NSError *)error
{
  if (interstitialAd != _interstitialAd) {
    return;
  }

  if (_preloadReject) {
    _preloadReject(@"E_FAILED_TO_LOAD", [error localizedDescription], error);
    [self clearPreloadPromise];
  }

  if (_showReject) {
    _showReject(@"E_FAILED_TO_LOAD", [error localizedDescription], error);
    [self clearShowPromise];
  }

  _didClick = NO;
  _showWhenLoaded = NO;
  _isPreloaded = NO;
  [self destroyInterstitial];
}

- (void)interstitialAdDidClick:(__unused FBInterstitialAd *)interstitialAd
{
  _didClick = YES;
}

- (void)interstitialAdDidClose:(FBInterstitialAd *)interstitialAd
{
  if (interstitialAd != _interstitialAd) {
    return;
  }

  if (_showResolve) {
    _showResolve(@(_didClick));
    [self clearShowPromise];
  }

  _didClick = NO;
  _showWhenLoaded = NO;
  _isPreloaded = NO;
  [self destroyInterstitial];
}

- (void)bridgeDidForeground:(__unused NSNotification *)notification
{
  _isBackground = NO;

  if (_adViewController) {
    [RCTPresentedViewController() presentViewController:_adViewController animated:NO completion:nil];
    _adViewController = nil;
  }
}

- (void)bridgeDidBackground:(__unused NSNotification *)notification
{
  _isBackground = YES;

  if (_interstitialAd) {
    _adViewController = RCTPresentedViewController();
    [_adViewController dismissViewControllerAnimated:NO completion:nil];
  }
}

- (BOOL)hasPendingOperation
{
  return _showResolve != nil || _preloadResolve != nil;
}

- (void)destroyInterstitial
{
  if (_interstitialAd) {
    _interstitialAd.delegate = nil;
    _interstitialAd = nil;
  }
}

- (void)clearShowPromise
{
  _showResolve = nil;
  _showReject = nil;
}

- (void)clearPreloadPromise
{
  _preloadResolve = nil;
  _preloadReject = nil;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
