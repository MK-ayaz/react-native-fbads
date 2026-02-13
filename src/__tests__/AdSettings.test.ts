import AdSettings from '../AdSettings';
import NativeModuleRegistry from '../native/NativeModuleRegistry';

// Mock the native module registry
jest.mock('../native/NativeModuleRegistry');

describe('AdSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('currentDeviceHash', () => {
    it('should retrieve device hash from native module', () => {
      const mockHash = 'test-device-hash-123';
      (NativeModuleRegistry.AdSettings.currentDeviceHash as any) = mockHash;

      const hash = AdSettings.currentDeviceHash;
      expect(hash).toBe(mockHash);
    });

    it('should handle errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (NativeModuleRegistry.AdSettings.currentDeviceHash as any) = undefined;

      const hash = AdSettings.currentDeviceHash;
      expect(hash).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addTestDevice', () => {
    it('should add a test device', () => {
      const addTestDeviceMock = jest.fn();
      NativeModuleRegistry.AdSettings.addTestDevice = addTestDeviceMock;

      AdSettings.addTestDevice('test-hash');
      expect(addTestDeviceMock).toHaveBeenCalledWith('test-hash');
    });

    it('should handle invalid device hash', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      AdSettings.addTestDevice('');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearTestDevices', () => {
    it('should clear test devices', () => {
      const clearMock = jest.fn();
      NativeModuleRegistry.AdSettings.clearTestDevices = clearMock;

      AdSettings.clearTestDevices();
      expect(clearMock).toHaveBeenCalled();
    });
  });

  describe('setLogLevel', () => {
    it('should set log level', () => {
      const setLogLevelMock = jest.fn();
      NativeModuleRegistry.AdSettings.setLogLevel = setLogLevelMock;

      AdSettings.setLogLevel('debug');
      expect(setLogLevelMock).toHaveBeenCalledWith('debug');
    });
  });

  describe('setIsChildDirected', () => {
    it('should set child-directed flag', () => {
      const setChildDirectedMock = jest.fn();
      NativeModuleRegistry.AdSettings.setIsChildDirected = setChildDirectedMock;

      AdSettings.setIsChildDirected(true);
      expect(setChildDirectedMock).toHaveBeenCalledWith(true);
    });
  });
});
